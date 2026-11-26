import type { BookingDto, NextAction, PayMode, ReturnResponse, SessionUser } from "@/types/api";
import { audit } from "../audit";
import { tx, type Exec } from "../db";
import { fail } from "../http";
import { nextCounter, pad, todayIST } from "../ids";
import { depositStatusAfter, lateDays, settle } from "../pricing";
import { PAY_MODES, int, obj, reqDate, reqInt, reqOneOf, str, strArray } from "../validate";
import { getBookingDto, getBookingRow, getSetting, totalPaidIn } from "./bookings";

const grand = (r: { rental_total: unknown; deposit_total: unknown; dry_clean_charge: unknown; transit_charge: unknown }) =>
  Number(r.rental_total) + Number(r.deposit_total) + Number(r.dry_clean_charge) + Number(r.transit_charge);

async function linkPhotos(x: Exec, ids: string[], bookingId: string) {
  if (!ids.length) return;
  const r = await x.execute({ sql: `UPDATE photos SET booking_id=? WHERE id IN (${ids.map(() => "?").join(",")})`, args: [bookingId, ...ids] });
  if (r.rowsAffected !== ids.length) fail("RULE", "One or more photoIds do not exist", { field: "photoIds" });
}

async function bookingGarments(x: Exec, bookingId: string) {
  const r = await x.execute({
    sql: "SELECT g.id, g.name, g.status FROM booking_items bi JOIN garments g ON g.id = bi.garment_id WHERE bi.booking_id = ? ORDER BY bi.id",
    args: [bookingId],
  });
  return r.rows.map((g) => ({ id: String(g.id), name: String(g.name), status: String(g.status) }));
}

async function insertPayment(x: Exec, bookingId: string, kind: string, amount: number, mode: PayMode, note: string | null, userId: string) {
  await x.execute({
    sql: "INSERT INTO payments(booking_id,kind,amount,mode,paid_on,note,recorded_by) VALUES (?,?,?,?,?,?,?)",
    args: [bookingId, kind, amount, mode, todayIST(), note, userId],
  });
}

// ---------------------------------------------------------------- pickup
export async function pickupBooking(user: SessionUser, id: string, b: Record<string, unknown>): Promise<BookingDto> {
  const condition = str(b, "handoverCondition", { optional: true, max: 500 }) ?? null;
  const photoIds = Array.isArray(b.photoIds) ? strArray(b, "photoIds", { max: 10 }) : [];
  const rawPayments = b.payments === undefined ? [] : b.payments;
  if (!Array.isArray(rawPayments) || rawPayments.length > 10) fail("VALIDATION", "payments: must be a short list", { field: "payments" });
  const payments = (rawPayments as unknown[]).map((p) => {
    const o = obj({ p }, "p")!;
    return {
      kind: reqOneOf(o, "kind", ["BALANCE", "DEPOSIT"] as const),
      amount: reqInt(o, "amount", { min: 1, max: 10_000_000 }),
      mode: reqOneOf(o, "mode", PAY_MODES),
      note: str(o, "note", { optional: true, max: 200 }) ?? null,
    };
  });
  await tx(async (x) => {
    const row = await getBookingRow(id, x);
    if (row.status !== "CONFIRMED") fail("RULE", `Booking is ${row.status}; only a CONFIRMED booking can be handed over`);
    const garments = await bookingGarments(x, id);
    const notReady = garments.filter((g) => g.status !== "AVAILABLE");
    if (notReady.length)
      fail("RULE", `Not ready to hand over: ${notReady.map((g) => `${g.name} (${g.id}) is ${g.status}`).join(", ")}`, { garmentIds: notReady.map((g) => g.id) });
    for (const p of payments) await insertPayment(x, id, p.kind, p.amount, p.mode, p.note, user.id);
    const paid = await totalPaidIn(x, id);
    const total = grand(row as never);
    if (paid > total) fail("RULE", `Collected ₹${paid} is more than the total ₹${total}`);
    if (paid < total) fail("RULE", `Collect ₹${total - paid} more before handing over (balance + deposit)`, { balanceDue: total - paid });
    await x.execute({
      sql: "UPDATE bookings SET status='OUT_ON_RENT', issued_by=?, handover_condition=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
      args: [user.id, condition, id],
    });
    await x.execute({
      sql: `UPDATE garments SET status='OUT_ON_RENT', updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id IN (${garments.map(() => "?").join(",")})`,
      args: garments.map((g) => g.id),
    });
    await linkPhotos(x, photoIds, id);
  });
  return getBookingDto(id);
}

// ---------------------------------------------------------------- extra payments
export async function addPayment(user: SessionUser, id: string, b: Record<string, unknown>): Promise<BookingDto> {
  const kind = reqOneOf(b, "kind", ["BALANCE", "DEPOSIT", "EXTRA", "REFUND"] as const);
  const amount = reqInt(b, "amount", { min: 1, max: 10_000_000 });
  const mode = reqOneOf(b, "mode", PAY_MODES);
  const note = str(b, "note", { optional: true, max: 200 }) ?? null;
  await tx(async (x) => {
    const row = await getBookingRow(id, x);
    const status = String(row.status);
    if (kind === "REFUND") {
      // pay a deposit refund that was left pending at return (clears the "Deposit refund pending" alert)
      if (status !== "COMPLETED" || row.deposit_status !== "HELD" || Number(row.refund_amount) <= 0) fail("RULE", "No deposit refund is pending on this booking");
      if (amount !== Number(row.refund_amount)) fail("RULE", `The pending refund is exactly ₹${Number(row.refund_amount)}`, { remaining: Number(row.refund_amount) });
      await x.execute({ sql: "UPDATE bookings SET deposit_status=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", args: [depositStatusAfter(Number(row.deposit_total), Number(row.refund_amount), true), id] });
    } else if (kind === "EXTRA") {
      if (status !== "COMPLETED") fail("RULE", "EXTRA payments are only for the extra amount owed after return");
      const extraPaid = Number((await x.execute({ sql: "SELECT COALESCE(SUM(amount),0) s FROM payments WHERE booking_id=? AND kind='EXTRA'", args: [id] })).rows[0].s);
      const remaining = Number(row.additional_due) - extraPaid;
      if (remaining <= 0) fail("RULE", "Nothing extra is owed on this booking");
      if (amount > remaining) fail("RULE", `Only ₹${remaining} is owed`, { remaining });
    } else {
      if (status !== "CONFIRMED" && status !== "OUT_ON_RENT") fail("RULE", `Cannot take ${kind} on a ${status} booking`);
      const remaining = grand(row as never) - (await totalPaidIn(x, id));
      if (amount > remaining) fail("RULE", `Only ₹${remaining} is still due`, { remaining });
    }
    await insertPayment(x, id, kind, amount, mode, note, user.id);
  });
  return getBookingDto(id);
}

// ---------------------------------------------------------------- return + settlement
const NEXT: readonly NextAction[] = ["AVAILABLE", "DRY_CLEAN", "REPAIR", "DAMAGED"];

export async function returnBooking(user: SessionUser, id: string, b: Record<string, unknown>): Promise<ReturnResponse> {
  // NOTE: lateFee / refund / deductions in the body are deliberately never read (AC3).
  const actual = reqDate(b, "actualReturnDate");
  const damage = reqInt(b, "damageCharge", { max: 10_000_000 });
  const cleaning = reqInt(b, "cleaningCharge", { max: 10_000_000 });
  const notes = str(b, "notes", { optional: true, max: 1000 }) ?? null;
  const photoIds = Array.isArray(b.photoIds) ? strArray(b, "photoIds", { max: 20 }) : [];
  if (!Array.isArray(b.items) || !b.items.length) fail("VALIDATION", "items: list every garment with what happens next", { field: "items" });
  const items = (b.items as unknown[]).map((it) => {
    const o = obj({ it }, "it")!;
    return {
      garmentId: String(str(o, "garmentId", { max: 40 })).toUpperCase(),
      next: reqOneOf(o, "nextAction", NEXT),
      vendor: str(o, "vendorName", { optional: true, max: 120 }),
      expected: o.expectedDate === undefined ? undefined : reqDate(o, "expectedDate"),
      cost: int(o, "cost", { optional: true, max: 10_000_000 }) ?? 0,
    };
  });
  // a non-object `refund` (e.g. a client-sent number) is ignored, never trusted
  const refundIn = b.refund && typeof b.refund === "object" && !Array.isArray(b.refund) ? (b.refund as Record<string, unknown>) : undefined;
  const pay = refundIn ? refundIn.pay === true : false;
  const refundMode = refundIn && pay ? reqOneOf(refundIn, "mode", ["CASH", "UPI", "BANK_TRANSFER"] as const) : "CASH";

  const settlement = await tx(async (x) => {
    const row = await getBookingRow(id, x);
    if (row.status !== "OUT_ON_RENT") fail("RULE", `Booking is ${row.status}; only a booking that is out on rent can be returned`);
    if (actual < String(row.pickup_date)) fail("VALIDATION", "actualReturnDate is before the pickup date", { field: "actualReturnDate" });
    if (actual > todayIST()) fail("VALIDATION", "actualReturnDate cannot be in the future", { field: "actualReturnDate" });

    const garments = await bookingGarments(x, id);
    const ids = new Set(garments.map((g) => g.id));
    const sent = new Set(items.map((i) => i.garmentId));
    if (sent.size !== items.length || sent.size !== ids.size || [...sent].some((g) => !ids.has(g)))
      fail("VALIDATION", `items must list each garment of this booking exactly once: ${[...ids].join(", ")}`, { field: "items" });

    const pct = Number(await getSetting(x, "late_fee_percent", "15"));
    const days = lateDays(String(row.return_due_date), actual);
    const s = settle({ depositTotal: Number(row.deposit_total), rentalTotal: Number(row.rental_total), damage, cleaning, lateDays: days, latePercent: pct });
    const refundPaidNow = pay && s.refund > 0;
    const depositStatus = depositStatusAfter(Number(row.deposit_total), s.refund, refundPaidNow);

    await x.execute({
      sql: `UPDATE bookings SET status='COMPLETED', actual_return_date=?, damage_charge=?, cleaning_charge=?, late_days=?, late_fee=?, refund_amount=?,
              additional_due=?, deposit_status=?, return_notes=?, received_by=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`,
      args: [actual, damage, cleaning, days, s.lateFee, s.refund, s.additionalDue, depositStatus, notes, user.id, id],
    });
    await x.execute({ sql: "UPDATE booking_items SET active=0 WHERE booking_id=?", args: [id] }); // frees the dates
    if (refundPaidNow) await insertPayment(x, id, "REFUND", s.refund, refundMode as PayMode, "Deposit refund at return", user.id);

    const defaultVendor = await getSetting(x, "default_care_vendor", "");
    for (const it of items) {
      const status = it.next === "AVAILABLE" ? "AVAILABLE" : it.next === "DAMAGED" ? "DAMAGED_REPAIR" : "IN_CARE";
      await x.execute({ sql: "UPDATE garments SET status=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", args: [status, it.garmentId] });
      if (it.next === "DRY_CLEAN" || it.next === "REPAIR") {
        const vendor = it.vendor || defaultVendor;
        if (!vendor) fail("VALIDATION", `vendorName is required to send ${it.garmentId} for ${it.next}`, { field: "items" });
        const careId = `CARE-${pad(await nextCounter(x, "care"), 4)}`;
        await x.execute({
          sql: "INSERT INTO care_jobs(id,garment_id,booking_id,kind,vendor_name,out_date,expected_date,cost,created_by) VALUES (?,?,?,?,?,?,?,?,?)",
          args: [careId, it.garmentId, id, it.next, vendor, actual, it.expected ?? null, it.cost, user.id],
        });
      }
    }
    await linkPhotos(x, photoIds, id);
    return { lateDays: days, lateFee: s.lateFee, deductions: s.deductions, refund: s.refund, additionalDue: s.additionalDue, depositStatus };
  });
  return { booking: await getBookingDto(id), settlement };
}

// ---------------------------------------------------------------- cancel (admin)
export async function cancelBooking(admin: SessionUser, id: string, b: Record<string, unknown>): Promise<BookingDto> {
  const reason = str(b, "reason", { optional: true, max: 300 });
  const ra = b.refundAdvance === undefined ? undefined : obj(b, "refundAdvance")!;
  const refund = ra ? { amount: reqInt(ra, "amount", { min: 0, max: 10_000_000 }), mode: reqOneOf(ra, "mode", PAY_MODES) } : undefined;
  await tx(async (x) => {
    const row = await getBookingRow(id, x);
    if (row.status !== "CONFIRMED") fail("RULE", `Only a CONFIRMED booking can be cancelled (this one is ${row.status})`);
    const paid = await totalPaidIn(x, id);
    if (refund && refund.amount > paid) fail("RULE", `Cannot refund ₹${refund.amount}; only ₹${paid} was received`);
    await x.execute({ sql: "UPDATE booking_items SET active=0 WHERE booking_id=?", args: [id] });
    await x.execute({
      sql: "UPDATE bookings SET status='CANCELLED', deposit_status='NOT_COLLECTED', return_notes=COALESCE(?,return_notes), updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
      args: [reason ? `Cancelled: ${reason}` : null, id],
    });
    if (refund && refund.amount > 0) await insertPayment(x, id, "REFUND", refund.amount, refund.mode, "Advance refund on cancellation", admin.id);
    await audit(x, admin.id, "booking.cancel", "booking", id, { status: "CONFIRMED", paid }, { status: "CANCELLED", refunded: refund?.amount ?? 0, advanceKept: paid - (refund?.amount ?? 0), reason });
  });
  return getBookingDto(id);
}

// ---------------------------------------------------------------- edit
export async function updateBooking(user: SessionUser, id: string, b: Record<string, unknown>): Promise<BookingDto> {
  const eventName = str(b, "eventName", { optional: true, max: 150 });
  const eventDate = b.eventDate === undefined ? undefined : reqDate(b, "eventDate");
  const notes = str(b, "notes", { optional: true, max: 1000 });
  const dry = int(b, "dryCleanCharge", { optional: true, max: 1_000_000 });
  const transit = int(b, "transitCharge", { optional: true, max: 1_000_000 });
  const damage = int(b, "damageCharge", { optional: true, max: 10_000_000 });
  const cleaning = int(b, "cleaningCharge", { optional: true, max: 10_000_000 });
  const moneyTouched = [dry, transit, damage, cleaning].some((v) => v !== undefined);
  if (moneyTouched && user.role !== "admin") fail("FORBIDDEN", "Only the owner can change money fields");

  await tx(async (x) => {
    const row = await getBookingRow(id, x);
    const status = String(row.status);
    if (status === "CANCELLED") fail("RULE", "A cancelled booking cannot be edited");
    if ((dry !== undefined || transit !== undefined) && status === "COMPLETED") fail("RULE", "Charges cannot be changed after the booking is completed");
    let settleFields: { late_fee: number; refund: number; additional: number; deposit_status: string } | undefined;
    if (damage !== undefined || cleaning !== undefined) {
      if (status !== "COMPLETED") fail("RULE", "Damage / cleaning charges can only be corrected after return");
      const refunds = Number((await x.execute({ sql: "SELECT COALESCE(SUM(amount),0) s FROM payments WHERE booking_id=? AND kind='REFUND'", args: [id] })).rows[0].s);
      if (refunds > 0) fail("RULE", "The deposit refund was already paid; adjust with the owner manually (record an EXTRA payment if more is owed)");
      const pct = Number(await getSetting(x, "late_fee_percent", "15"));
      const s = settle({
        depositTotal: Number(row.deposit_total), rentalTotal: Number(row.rental_total),
        damage: damage ?? Number(row.damage_charge), cleaning: cleaning ?? Number(row.cleaning_charge), lateDays: Number(row.late_days), latePercent: pct,
      });
      settleFields = { late_fee: s.lateFee, refund: s.refund, additional: s.additionalDue, deposit_status: depositStatusAfter(Number(row.deposit_total), s.refund, false) };
    }
    const before = { dry: row.dry_clean_charge, transit: row.transit_charge, damage: row.damage_charge, cleaning: row.cleaning_charge, refund: row.refund_amount, additionalDue: row.additional_due };
    await x.execute({
      sql: `UPDATE bookings SET event_name=COALESCE(?,event_name), event_date=COALESCE(?,event_date), notes=COALESCE(?,notes),
              dry_clean_charge=COALESCE(?,dry_clean_charge), transit_charge=COALESCE(?,transit_charge),
              damage_charge=COALESCE(?,damage_charge), cleaning_charge=COALESCE(?,cleaning_charge),
              late_fee=COALESCE(?,late_fee), refund_amount=COALESCE(?,refund_amount), additional_due=COALESCE(?,additional_due), deposit_status=COALESCE(?,deposit_status),
              updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`,
      args: [eventName ?? null, eventDate ?? null, notes ?? null, dry ?? null, transit ?? null, damage ?? null, cleaning ?? null,
        settleFields?.late_fee ?? null, settleFields?.refund ?? null, settleFields?.additional ?? null, settleFields?.deposit_status ?? null, id],
    });
    if (moneyTouched) {
      const a = (await x.execute({ sql: "SELECT dry_clean_charge,transit_charge,damage_charge,cleaning_charge,refund_amount,additional_due FROM bookings WHERE id=?", args: [id] })).rows[0];
      await audit(x, user.id, "booking.money_edit", "booking", id, before, { dry: a.dry_clean_charge, transit: a.transit_charge, damage: a.damage_charge, cleaning: a.cleaning_charge, refund: a.refund_amount, additionalDue: a.additional_due });
    }
  });
  return getBookingDto(id);
}
