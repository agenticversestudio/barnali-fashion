import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addDays, } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as createB } from "@/app/api/v1/bookings/route";
import { GET as getB, PATCH as patchB } from "@/app/api/v1/bookings/[id]/route";
import { POST as pickup } from "@/app/api/v1/bookings/[id]/pickup/route";
import { POST as ret } from "@/app/api/v1/bookings/[id]/return/route";
import { POST as pay } from "@/app/api/v1/bookings/[id]/payments/route";
import { POST as cancel } from "@/app/api/v1/bookings/[id]/cancel/route";
import { POST as quote } from "@/app/api/v1/bookings/quote/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

let A = "";
let S = "";
const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const today = todayIST();
const due = addDays(today, 2);

async function mk(garmentId: string, over: Record<string, unknown> = {}, phone = "7999200001") {
  const r = await H("POST", createB, "/api/v1/bookings", {
    cookie: S,
    body: {
      customer: { name: "Zt Life", phone },
      eventName: "Event", eventDate: due, pickupDate: today, returnDueDate: due, garmentIds: [garmentId],
      advance: { amount: 2000, mode: "CASH" }, ...over,
    },
  });
  expect(r.status).toBe(201);
  return r.data.booking as any;
}
const act = (h: unknown, id: string, body: unknown, cookie = S) => H("POST", h, `/api/v1/bookings/${id}/x`, { cookie, params: { id }, body });
const get = async (id: string) => (await H("GET", getB, `/api/v1/bookings/${id}`, { cookie: S, params: { id } })).data.booking;
const gstatus = async (id: string) => String((await db().execute({ sql: "SELECT status FROM garments WHERE id=?", args: [id] })).rows[0].status);
/** make a booking look like it started earlier (the API refuses past pickups, real life gets there by waiting) */
async function backdate(id: string, pickup: string, dueDate: string) {
  await db().execute({ sql: "UPDATE bookings SET pickup_date=?, return_due_date=? WHERE id=?", args: [pickup, dueDate, id] });
  await db().execute({ sql: "UPDATE booking_items SET pickup_date=?, return_due_date=? WHERE booking_id=?", args: [pickup, dueDate, id] });
}

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  for (const g of ["ZT-G1", "ZT-G2", "ZT-G3", "ZT-G4", "ZT-G5", "ZT-G6", "ZT-G7", "ZT-G8"])
    await db().execute({ sql: "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES (?,?,?,?,?,?,?)", args: [g, `Zt ${g}`, "Lehenga", "M", "R-1", 5000, 3000] });
  S = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_staff", password: "TestPass#1" } }));
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(cleanup);

describe("pickup + payments", () => {
  let id = "";
  it("pickup with balance not collected → 422 and nothing changes (atomic)", async () => {
    const b = await mk("ZT-G1", { dryCleanCharge: 300, transitCharge: 200 });
    id = b.id;
    expect(b.grandTotal).toBe(8500);
    const r = await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 1000, mode: "CASH" }] });
    expect(r.status).toBe(422);
    expect(r.data.error.message).toMatch(/Collect ₹5500 more/);
    const after = await get(id);
    expect(after.status).toBe("CONFIRMED");
    expect(after.payments).toHaveLength(1); // the 1000 was rolled back
    expect(await gstatus("ZT-G1")).toBe("AVAILABLE");
  });
  it("overpay at pickup → 422", async () => {
    expect((await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 9999, mode: "CASH" }] })).status).toBe(422);
  });
  it("pickup collecting balance + deposit → OUT_ON_RENT, garment OUT_ON_RENT", async () => {
    const r = await act(pickup, id, {
      handoverCondition: "Excellent, dori attached",
      payments: [{ kind: "BALANCE", amount: 3500, mode: "UPI" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }],
    });
    expect(r.status).toBe(200);
    expect(r.data.booking).toMatchObject({ status: "OUT_ON_RENT", amountPaid: 8500, balanceDue: 0, handoverCondition: "Excellent, dori attached" });
    expect(await gstatus("ZT-G1")).toBe("OUT_ON_RENT");
  });
  it("second pickup → 422", async () => {
    expect((await act(pickup, id, {})).status).toBe(422);
  });
  it("cannot hand over a garment that is not on the rack", async () => {
    const b2 = await mk("ZT-G2");
    await db().execute("UPDATE garments SET status='IN_CARE' WHERE id='ZT-G2'");
    const r = await act(pickup, b2.id, { payments: [{ kind: "BALANCE", amount: 6000, mode: "CASH" }] });
    expect(r.status).toBe(422);
    expect(r.data.error.message).toMatch(/ZT-G2.*IN_CARE/);
    await db().execute("UPDATE garments SET status='AVAILABLE' WHERE id='ZT-G2'");
  });
  it("payments endpoint: balance on a confirmed booking, over-limit refused, cancelled refused", async () => {
    const b = await mk("ZT-G3", {}, "7999200003");
    expect((await act(pay, b.id, { kind: "BALANCE", amount: 999999, mode: "CASH" })).status).toBe(422);
    const ok = await act(pay, b.id, { kind: "BALANCE", amount: 1000, mode: "UPI", note: "part" });
    expect(ok.status).toBe(201);
    expect(ok.data.booking.amountPaid).toBe(3000);
    expect(ok.data.booking.balanceDue).toBe(5000);
    expect((await act(pay, b.id, { kind: "EXTRA", amount: 10, mode: "CASH" })).status).toBe(422); // not completed
    expect((await act(pay, b.id, { kind: "REFUND", amount: 10, mode: "CASH" })).status).toBe(400); // kind not allowed here
  });
});

describe("return + settlement (AC2, AC3)", () => {
  let id = "";
  it("3 days late + damage + cleaning: server computes; client lateFee/refund ignored", async () => {
    const b = await mk("ZT-G4", {}, "7999200004");
    id = b.id;
    await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }] });
    await backdate(id, addDays(today, -6), addDays(today, -3)); // due 3 days ago
    const r = await act(ret, id, {
      actualReturnDate: today, damageCharge: 500, cleaningCharge: 300,
      lateFee: 0, refund: 3000, deductions: 0, additionalDue: 0, // tampering attempt: must be ignored
      items: [{ garmentId: "ZT-G4", nextAction: "DRY_CLEAN", vendorName: "Zt Cleaners", expectedDate: addDays(today, 3), cost: 400 }],
      refund_: undefined,
    });
    expect(r.status).toBe(200);
    // late fee = round(5000 × 15 %) = 750 × 3 = 2250; deductions 2250+500+300 = 3050 > deposit 3000
    expect(r.data.settlement).toEqual({ lateDays: 3, lateFee: 2250, deductions: 3050, refund: 0, additionalDue: 50, depositStatus: "FORFEITED" });
    expect(r.data.booking).toMatchObject({ status: "COMPLETED", actualReturnDate: today, lateFee: 2250, additionalDue: 50, refundAmount: 0, balanceDue: 0 });
    expect(r.data.booking.payments.some((p: any) => p.kind === "REFUND")).toBe(false);
    expect(await gstatus("ZT-G4")).toBe("IN_CARE");
    const care = await db().execute({ sql: "SELECT id,kind,vendor_name,cost,status,booking_id FROM care_jobs WHERE garment_id='ZT-G4'" });
    expect(care.rows).toHaveLength(1);
    expect(care.rows[0]).toMatchObject({ kind: "DRY_CLEAN", vendor_name: "Zt Cleaners", cost: 400, status: "OUT", booking_id: id });
    expect(String(care.rows[0].id)).toMatch(/^CARE-\d{4}$/);
  });
  it("returned dates are freed: the same garment can be booked again for them", async () => {
    const q = await H("POST", quote, "/api/v1/bookings/quote", { cookie: S, body: { garmentIds: ["ZT-G4"], pickupDate: addDays(today, -6), returnDueDate: addDays(today, -3) } });
    expect(q.data.conflicts).toEqual([]);
  });
  it("EXTRA payment settles the amount owed; more than owed → 422", async () => {
    expect((await act(pay, id, { kind: "EXTRA", amount: 51, mode: "CASH" })).status).toBe(422);
    const r = await act(pay, id, { kind: "EXTRA", amount: 50, mode: "UPI" });
    expect(r.status).toBe(201);
    expect(r.data.booking.additionalDue).toBe(0);
    expect((await act(pay, id, { kind: "EXTRA", amount: 1, mode: "CASH" })).status).toBe(422);
  });
  it("on-time clean return, refund paid in cash → REFUNDED + REFUND payment, garment AVAILABLE", async () => {
    const b = await mk("ZT-G5", {}, "7999200005");
    await act(pickup, b.id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }] });
    const r = await act(ret, b.id, { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: "ZT-G5", nextAction: "AVAILABLE" }], refund: { pay: true, mode: "CASH" } });
    expect(r.data.settlement).toEqual({ lateDays: 0, lateFee: 0, deductions: 0, refund: 3000, additionalDue: 0, depositStatus: "REFUNDED" });
    expect(r.data.booking.payments.find((p: any) => p.kind === "REFUND")).toMatchObject({ amount: 3000, mode: "CASH" });
    expect(await gstatus("ZT-G5")).toBe("AVAILABLE");
  });
  it("damage 1000, refund paid → PARTIALLY_REFUNDED; garment DAMAGED_REPAIR", async () => {
    const b = await mk("ZT-G6", {}, "7999200006");
    await act(pickup, b.id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }] });
    const r = await act(ret, b.id, { actualReturnDate: today, damageCharge: 1000, cleaningCharge: 0, items: [{ garmentId: "ZT-G6", nextAction: "DAMAGED" }], refund: { pay: true, mode: "UPI" } });
    expect(r.data.settlement).toMatchObject({ refund: 2000, depositStatus: "PARTIALLY_REFUNDED" });
    expect(await gstatus("ZT-G6")).toBe("DAMAGED_REPAIR");
  });
  it("refund not paid now → deposit stays HELD with refund owed", async () => {
    const b = await mk("ZT-G7", {}, "7999200007");
    await act(pickup, b.id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }] });
    const r = await act(ret, b.id, { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: "ZT-G7", nextAction: "AVAILABLE" }] });
    expect(r.data.settlement).toMatchObject({ refund: 3000, depositStatus: "HELD" });
    expect(r.data.booking.payments.some((p: any) => p.kind === "REFUND")).toBe(false);
    expect((await get(b.id)).refundAmount).toBe(3000);
  });
  it("validation: wrong state, items mismatch, future date, before pickup, care without vendor", async () => {
    const b = await mk("ZT-G8", {}, "7999200008");
    const base = { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: "ZT-G8", nextAction: "AVAILABLE" }] };
    expect((await act(ret, b.id, base)).status).toBe(422); // still CONFIRMED
    await act(pickup, b.id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }, { kind: "DEPOSIT", amount: 3000, mode: "CASH" }] });
    expect((await act(ret, b.id, { ...base, items: [] })).status).toBe(400);
    expect((await act(ret, b.id, { ...base, items: [{ garmentId: "ZT-G1", nextAction: "AVAILABLE" }] })).status).toBe(400);
    expect((await act(ret, b.id, { ...base, actualReturnDate: addDays(today, 1) })).status).toBe(400);
    expect((await act(ret, b.id, { ...base, actualReturnDate: addDays(today, -5) })).status).toBe(400);
    expect((await act(ret, b.id, { ...base, damageCharge: -1 })).status).toBe(400);
    expect((await act(ret, b.id, { ...base, items: [{ garmentId: "ZT-G8", nextAction: "REPAIR" }] })).status).toBe(400); // no vendor, no default
    expect((await get(b.id)).status).toBe("OUT_ON_RENT"); // all rejected → unchanged
    expect(await gstatus("ZT-G8")).toBe("OUT_ON_RENT");
  });
});

describe("cancel (admin) + edit", () => {
  it("staff cannot cancel; admin cancels a CONFIRMED booking, dates free up, advance policy recorded", async () => {
    await db().execute("UPDATE garments SET status='AVAILABLE' WHERE id IN ('ZT-G1','ZT-G2')");
    const b = await mk("ZT-G2", { pickupDate: addDays(today, 20), returnDueDate: addDays(today, 22) }, "7999200010");
    expect((await act(cancel, b.id, {}, S)).status).toBe(403);
    expect((await act(cancel, b.id, { refundAdvance: { amount: 99999, mode: "CASH" } }, A)).status).toBe(422);
    const r = await act(cancel, b.id, { reason: "Customer changed mind", refundAdvance: { amount: 500, mode: "CASH" } }, A);
    expect(r.status).toBe(200);
    expect(r.data.booking.status).toBe("CANCELLED");
    expect(r.data.booking.payments.find((p: any) => p.kind === "REFUND").amount).toBe(500);
    const q = await H("POST", quote, "/api/v1/bookings/quote", { cookie: S, body: { garmentIds: ["ZT-G2"], pickupDate: addDays(today, 20), returnDueDate: addDays(today, 22) } });
    expect(q.data.conflicts).toEqual([]);
    const a = await db().execute({ sql: "SELECT after FROM audit_log WHERE action='booking.cancel' AND entity_id=?", args: [b.id] });
    expect(JSON.parse(String(a.rows[0].after))).toMatchObject({ refunded: 500, advanceKept: 1500 });
    expect((await act(cancel, b.id, {}, A)).status).toBe(422); // already cancelled
  });
  it("cannot cancel once out on rent", async () => {
    const list = await db().execute("SELECT id FROM bookings WHERE status='OUT_ON_RENT' AND created_by='ZT-S1' LIMIT 1");
    const id = String(list.rows[0].id);
    expect((await act(cancel, id, {}, A)).status).toBe(422);
  });
  it("PATCH: staff edits non-money fields; staff money edit → 403; admin money edit audited", async () => {
    const b = await mk("ZT-G1", { pickupDate: addDays(today, 30), returnDueDate: addDays(today, 31) }, "7999200011");
    const p = (cookie: string, body: object) => H("PATCH", patchB, `/api/v1/bookings/${b.id}`, { cookie, params: { id: b.id }, body });
    expect((await p(S, { eventName: "Reception", notes: "call before" })).data.booking).toMatchObject({ eventName: "Reception", notes: "call before" });
    expect((await p(S, { transitCharge: 100 })).status).toBe(403);
    const r = await p(A, { transitCharge: 150 });
    expect(r.data.booking).toMatchObject({ transitCharge: 150, grandTotal: 8150 });
    const a = await db().execute({ sql: "SELECT before, after FROM audit_log WHERE action='booking.money_edit' AND entity_id=?", args: [b.id] });
    expect(JSON.parse(String(a.rows[0].before)).transit).toBe(0);
    expect(JSON.parse(String(a.rows[0].after)).transit).toBe(150);
  });
  it("admin corrects damage on a completed, unrefunded return → refund recomputed; refunded one is locked", async () => {
    const held = await db().execute("SELECT id FROM bookings WHERE status='COMPLETED' AND deposit_status='HELD' AND created_by='ZT-S1' LIMIT 1");
    const id = String(held.rows[0].id);
    const r = await H("PATCH", patchB, `/api/v1/bookings/${id}`, { cookie: A, params: { id }, body: { damageCharge: 800 } });
    expect(r.status).toBe(200);
    expect(r.data.booking).toMatchObject({ damageCharge: 800, refundAmount: 2200, additionalDue: 0 });
    const refunded = await db().execute("SELECT booking_id FROM payments WHERE kind='REFUND' AND recorded_by='ZT-S1' LIMIT 1");
    const rid = String(refunded.rows[0].booking_id);
    expect((await H("PATCH", patchB, `/api/v1/bookings/${rid}`, { cookie: A, params: { id: rid }, body: { damageCharge: 5 } })).status).toBe(422);
    expect((await H("PATCH", patchB, `/api/v1/bookings/${rid}`, { cookie: A, params: { id: rid }, body: { dryCleanCharge: 5 } })).status).toBe(422);
  });
});
