import type { Row } from "@tursodatabase/serverless/compat";
import type {
  BookingDto, BookingItemDto, BookingListQuery, BookingStatus, ConflictInfo, DepositStatus, PayMode, PaymentDto, PaymentKind,
} from "@/types/api";
import { db, type Exec } from "../db";
import { ApiError, fail } from "../http";
import { todayIST } from "../ids";
import { likeArg } from "../query";
import { BUFFER_DAYS } from "./garments";

const opt = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : String(v));

export async function getSetting(x: Exec, key: string, fallback: string): Promise<string> {
  const r = await x.execute({ sql: "SELECT value FROM settings WHERE key=?", args: [key] });
  return r.rows[0] ? String(r.rows[0].value) : fallback;
}

/** Active bookings that clash (buffer applied) with [pickup, due] for these garments. Friendly pre-check; the DB trigger is the real guard. */
export async function findConflicts(
  x: Exec,
  garmentIds: string[],
  pickup: string,
  due: string,
  excludeBookingId?: string,
): Promise<ConflictInfo[]> {
  if (!garmentIds.length) return [];
  const r = await x.execute({
    sql: `SELECT o.garment_id, o.booking_id, o.pickup_date, o.return_due_date, g.name
          FROM booking_items o JOIN garments g ON g.id = o.garment_id
          WHERE o.active = 1 AND o.garment_id IN (${garmentIds.map(() => "?").join(",")})
            AND ? <= date(o.return_due_date, '+${BUFFER_DAYS} day') AND date(?, '+${BUFFER_DAYS} day') >= o.pickup_date
            ${excludeBookingId ? "AND o.booking_id <> ?" : ""}
          ORDER BY o.pickup_date`,
    args: [...garmentIds, pickup, due, ...(excludeBookingId ? [excludeBookingId] : [])],
  });
  return r.rows.map((row) => ({
    garmentId: String(row.garment_id),
    garmentName: String(row.name),
    heldBy: String(row.booking_id),
    from: String(row.pickup_date),
    to: String(row.return_due_date),
  }));
}

const fmt = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return `${day} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
};
export const conflictMessage = (c: ConflictInfo) =>
  `${c.garmentName ?? c.garmentId} (${c.garmentId}) is already reserved by ${c.heldBy} for ${fmt(c.from)} – ${fmt(c.to)}`;

export function conflictError(conflicts: ConflictInfo[]): ApiError {
  if (!conflicts.length) return new ApiError("GARMENT_CONFLICT", "A garment was just booked by someone else for these dates. Please check availability again.");
  const msg = conflicts.length === 1 ? conflictMessage(conflicts[0]) : `${conflicts.length} garments are already reserved: ${conflicts.map(conflictMessage).join("; ")}`;
  return new ApiError("GARMENT_CONFLICT", msg, { conflicts });
}

const MONEY_IN: PaymentKind[] = ["ADVANCE", "BALANCE", "DEPOSIT", "EXTRA"];

/** Build full DTOs (items, payments, derived money) for booking ids, preserving order. */
export async function bookingDtos(ids: string[], x: Exec = db()): Promise<BookingDto[]> {
  if (!ids.length) return [];
  const ph = ids.map(() => "?").join(",");
  const b = await x.execute({
    sql: `SELECT b.*, c.name AS c_name, c.phone AS c_phone, c.whatsapp AS c_wa, c.city AS c_city
          FROM bookings b JOIN customers c ON c.id = b.customer_id WHERE b.id IN (${ph})`,
    args: ids,
  });
  const it = await x.execute({
    sql: `SELECT bi.booking_id, bi.garment_id, bi.rental_price, bi.security_deposit, g.name, g.size, g.rack
          FROM booking_items bi JOIN garments g ON g.id = bi.garment_id WHERE bi.booking_id IN (${ph}) ORDER BY bi.id`,
    args: ids,
  });
  const pay = await x.execute({
    sql: `SELECT p.id, p.booking_id, p.kind, p.amount, p.mode, p.paid_on, p.note, COALESCE(u.name, p.recorded_by) AS by_name
          FROM payments p LEFT JOIN users u ON u.id = p.recorded_by WHERE p.booking_id IN (${ph}) ORDER BY p.id`,
    args: ids,
  });
  const items = new Map<string, BookingItemDto[]>();
  for (const r of it.rows) {
    const k = String(r.booking_id);
    if (!items.has(k)) items.set(k, []);
    items.get(k)!.push({
      garmentId: String(r.garment_id), name: String(r.name), size: String(r.size), rack: opt(r.rack),
      rentalPrice: Number(r.rental_price), securityDeposit: Number(r.security_deposit),
    });
  }
  const pays = new Map<string, PaymentDto[]>();
  for (const r of pay.rows) {
    const k = String(r.booking_id);
    if (!pays.has(k)) pays.set(k, []);
    pays.get(k)!.push({
      id: Number(r.id), kind: r.kind as PaymentKind, amount: Number(r.amount), mode: r.mode as PayMode,
      paidOn: String(r.paid_on), note: opt(r.note), recordedBy: String(r.by_name),
    });
  }
  const today = todayIST();
  const byId = new Map(b.rows.map((r) => [String(r.id), r]));
  return ids.filter((id) => byId.has(id)).map((id) => toDto(byId.get(id)!, items.get(id) ?? [], pays.get(id) ?? [], today));
}

function toDto(r: Row, items: BookingItemDto[], payments: PaymentDto[], today: string): BookingDto {
  const rental = Number(r.rental_total), deposit = Number(r.deposit_total), dry = Number(r.dry_clean_charge), transit = Number(r.transit_charge);
  const grandTotal = rental + deposit + dry + transit;
  const amountPaid = payments.filter((p) => MONEY_IN.includes(p.kind)).reduce((s, p) => s + p.amount, 0);
  const extraPaid = payments.filter((p) => p.kind === "EXTRA").reduce((s, p) => s + p.amount, 0);
  const status = r.status as BookingStatus;
  const dto: BookingDto = {
    id: String(r.id),
    customer: { id: String(r.customer_id), name: String(r.c_name), phone: String(r.c_phone) },
    eventName: String(r.event_name), eventDate: String(r.event_date), pickupDate: String(r.pickup_date), returnDueDate: String(r.return_due_date),
    status, items,
    rentalTotal: rental, depositTotal: deposit, dryCleanCharge: dry, transitCharge: transit,
    grandTotal, amountPaid,
    // before return: what is still to collect; after return the grand-total balance is closed, only additionalDue can remain
    balanceDue: status === "CANCELLED" || status === "COMPLETED" ? 0 : Math.max(0, grandTotal - amountPaid),
    payments,
    damageCharge: Number(r.damage_charge), cleaningCharge: Number(r.cleaning_charge), lateDays: Number(r.late_days), lateFee: Number(r.late_fee),
    refundAmount: Number(r.refund_amount),
    additionalDue: Math.max(0, Number(r.additional_due) - extraPaid),
    depositStatus: r.deposit_status as DepositStatus,
    isOverdue: status === "OUT_ON_RENT" && today > String(r.return_due_date),
    createdAt: String(r.created_at),
  };
  const set = (k: "actualReturnDate" | "handoverCondition" | "returnNotes" | "notes", v: string | undefined) => { if (v !== undefined) dto[k] = v; };
  set("actualReturnDate", opt(r.actual_return_date));
  set("handoverCondition", opt(r.handover_condition));
  set("returnNotes", opt(r.return_notes));
  set("notes", opt(r.notes));
  const wa = opt(r.c_wa), city = opt(r.c_city);
  if (wa) dto.customer.whatsapp = wa;
  if (city) dto.customer.city = city;
  return dto;
}

export async function getBookingDto(id: string, x: Exec = db()): Promise<BookingDto> {
  const [dto] = await bookingDtos([id], x);
  if (!dto) return fail("NOT_FOUND", "Booking not found");
  return dto;
}

export async function listBookings(q: BookingListQuery & { limit: number }): Promise<{ bookings: BookingDto[]; nextCursor?: string }> {
  const where: string[] = ["1=1"];
  const args: (string | number)[] = [];
  if (q.status) { where.push("b.status = ?"); args.push(q.status); }
  if (q.customerId) { where.push("b.customer_id = ?"); args.push(q.customerId); }
  // from/to: bookings whose [pickup, return_due] touches the window
  if (q.from) { where.push("b.return_due_date >= ?"); args.push(q.from); }
  if (q.to) { where.push("b.pickup_date <= ?"); args.push(q.to); }
  if (q.q) {
    const like = likeArg(q.q);
    where.push("(b.id LIKE ? ESCAPE '!' OR c.name LIKE ? ESCAPE '!' OR c.phone LIKE ? ESCAPE '!' OR b.event_name LIKE ? ESCAPE '!')");
    args.push(like, like, like, like);
  }
  if (q.cursor) {
    const [ca, cid] = q.cursor.split("|");
    if (!ca || !cid) fail("VALIDATION", "cursor: invalid", { field: "cursor" });
    where.push("(b.created_at < ? OR (b.created_at = ? AND b.id < ?))");
    args.push(ca, ca, cid);
  }
  const r = await db().execute({
    sql: `SELECT b.id, b.created_at FROM bookings b JOIN customers c ON c.id = b.customer_id
          WHERE ${where.join(" AND ")} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`,
    args: [...args, q.limit + 1],
  });
  const page = r.rows.slice(0, q.limit);
  const bookings = await bookingDtos(page.map((x) => String(x.id)));
  const last = page[page.length - 1];
  return { bookings, nextCursor: r.rows.length > q.limit && last ? `${last.created_at}|${last.id}` : undefined };
}

export async function getBookingRow(id: string, x: Exec): Promise<Row> {
  const r = await x.execute({ sql: "SELECT * FROM bookings WHERE id = ?", args: [id] });
  if (!r.rows[0]) return fail("NOT_FOUND", "Booking not found");
  return r.rows[0];
}

export async function totalPaidIn(x: Exec, bookingId: string): Promise<number> {
  const r = await x.execute({ sql: "SELECT COALESCE(SUM(amount),0) s FROM payments WHERE booking_id=? AND kind <> 'REFUND'", args: [bookingId] });
  return Number(r.rows[0].s);
}
