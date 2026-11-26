// Deep-audit stress suite: concurrency + atomicity. Runs against the .env.local dev DB (ids/phones "ZT"/7999...), cleans up after itself.
// Invariants asserted after every storm: no booking without items, no item without booking, no overlapping active items,
// no orphan customers, no half-written payments, counters not burned by failed attempts beyond what is documented.
process.env.STORAGE_DRIVER = "fake";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addDays } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as createB } from "@/app/api/v1/bookings/route";
import { POST as pickup } from "@/app/api/v1/bookings/[id]/pickup/route";
import { POST as ret } from "@/app/api/v1/bookings/[id]/return/route";
import { POST as pay } from "@/app/api/v1/bookings/[id]/payments/route";
import { POST as cancel } from "@/app/api/v1/bookings/[id]/cancel/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const today = todayIST();
let A = "";
let phoneSeq = 0;
const phone = () => `79994${String(100000 + phoneSeq++).slice(1)}`; // 7999 4xxxx -> cleaned by helpers ('7999%')

const q = async (sql: string, args: (string | number)[] = []) => (await db().execute({ sql, args })).rows;
const n = async (sql: string, args: (string | number)[] = []) => Number((await q(sql, args))[0].n);

const book = (garmentIds: string[], pickupDate: string, returnDueDate: string, adv = 500) =>
  H("POST", createB, "/api/v1/bookings", {
    cookie: A,
    body: { customer: { name: "Zt Stress", phone: phone() }, eventName: "E", eventDate: returnDueDate, garmentIds, pickupDate, returnDueDate, advance: { amount: adv, mode: "CASH" } },
  });
const act = (h: unknown, id: string, body: unknown) => H("POST", h, `/api/v1/bookings/${id}/x`, { cookie: A, params: { id }, body });

/** the invariants that must hold no matter how the storm landed */
async function invariants() {
  expect(await n("SELECT COUNT(*) n FROM booking_items WHERE booking_id NOT IN (SELECT id FROM bookings)")).toBe(0);
  expect(await n("SELECT COUNT(*) n FROM bookings WHERE created_by LIKE 'ZT%' AND id NOT IN (SELECT booking_id FROM booking_items)")).toBe(0);
  expect(await n("SELECT COUNT(*) n FROM payments WHERE booking_id NOT IN (SELECT id FROM bookings)")).toBe(0);
  expect(
    await n(`SELECT COUNT(*) n FROM booking_items a JOIN booking_items b ON a.garment_id=b.garment_id AND a.id<b.id
             WHERE a.active=1 AND b.active=1 AND a.garment_id LIKE 'ZT-ST%' AND a.pickup_date <= date(b.return_due_date,'+1 day') AND date(a.return_due_date,'+1 day') >= b.pickup_date`),
  ).toBe(0);
  // every ZT customer made in this file belongs to at least one booking (a failed booking must not leave a customer behind)
  expect(await n("SELECT COUNT(*) n FROM customers WHERE phone LIKE '79994%' AND id NOT IN (SELECT customer_id FROM bookings)")).toBe(0);
}

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  for (let i = 1; i <= 6; i++)
    await db().execute({ sql: "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES (?,?,?,?,?,?,?)", args: [`ZT-ST${i}`, `Stress ${i}`, "Lehenga", "M", `R-${i}`, 4000, 2500] });
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(cleanup);

describe("AC1 extended: booking storms", () => {
  it("40 parallel creates, same garment + dates, 40 different new customers: exactly 1 booking, 39 x 409, no orphan customers, counter not burned", async () => {
    const yr = String(new Date().getFullYear());
    const counterBefore = Number((await q("SELECT value v FROM counters WHERE name=?", [`booking-${yr}`]))[0]?.v ?? 0);
    const due = addDays(today, 40);
    const rs = await Promise.all(Array.from({ length: 40 }, () => book(["ZT-ST1"], addDays(today, 38), due)));
    const ok = rs.filter((r) => r.status === 201);
    const conflict = rs.filter((r) => r.status === 409);
    expect(ok).toHaveLength(1);
    expect(conflict).toHaveLength(39);
    expect(rs.length - ok.length - conflict.length).toBe(0); // nothing else (no 500s)
    expect(await n("SELECT COUNT(*) n FROM booking_items WHERE garment_id='ZT-ST1' AND active=1")).toBe(1);
    expect(await n("SELECT COUNT(*) n FROM customers WHERE phone LIKE '79994%'")).toBe(1);
    expect(await n("SELECT COUNT(*) n FROM payments WHERE booking_id=?", [ok[0].data.booking.id])).toBe(1);
    const counterAfter = Number((await q("SELECT value v FROM counters WHERE name=?", [`booking-${yr}`]))[0].v);
    expect(counterAfter - counterBefore).toBe(1); // failed attempts roll their counter back: no gaps in booking numbers
    await invariants();
  });

  it("cross-overlapping multi-garment bookings ([1,2] [2,3] [3,1] x6 parallel): exactly 1 wins, nothing half-written", async () => {
    const p = addDays(today, 60);
    const d = addDays(today, 62);
    const sets = [["ZT-ST1", "ZT-ST2"], ["ZT-ST2", "ZT-ST3"], ["ZT-ST3", "ZT-ST1"]];
    const rs = await Promise.all(Array.from({ length: 18 }, (_, i) => book(sets[i % 3], p, d)));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409)).toHaveLength(17);
    const win = rs.find((r) => r.status === 201)!.data.booking;
    expect(await n("SELECT COUNT(*) n FROM booking_items WHERE booking_id=?", [win.id])).toBe(2);
    await invariants();
  });

  it("non-overlapping windows on one garment, all in parallel: every one succeeds (the lock is per overlap, not global)", async () => {
    const rs = await Promise.all(Array.from({ length: 6 }, (_, i) => book(["ZT-ST4"], addDays(today, 100 + i * 5), addDays(today, 101 + i * 5))));
    expect(rs.map((r) => r.status)).toEqual([201, 201, 201, 201, 201, 201]);
    await invariants();
  });

  it("buffer boundary under load: back-to-back windows (gap 2 days ok, gap 1 day refused) in one parallel burst", async () => {
    // existing: day 200..201. ok: 203..204 (gap 1 free day), refused: 202..203 (next day after return)
    expect((await book(["ZT-ST5"], addDays(today, 200), addDays(today, 201))).status).toBe(201);
    const [okR, badR, badB] = await Promise.all([
      book(["ZT-ST5"], addDays(today, 203), addDays(today, 204)),
      book(["ZT-ST5"], addDays(today, 202), addDays(today, 203)),
      book(["ZT-ST5"], addDays(today, 198), addDays(today, 199)),
    ]);
    expect(okR.status).toBe(201);
    expect(badR.status).toBe(409);
    expect(badB.status).toBe(409);
    await invariants();
  });
});

describe("double-submit protection on money actions", () => {
  async function outOnRent(garment: string) {
    const b = await book([garment], today, addDays(today, 2), 1000);
    expect(b.status).toBe(201);
    const id = b.data.booking.id as string;
    expect((await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 5500, mode: "CASH" }] })).status).toBe(200);
    return id;
  }

  it("pickup submitted 6x at once: exactly one 200, payments written once", async () => {
    const b = await book(["ZT-ST6"], today, addDays(today, 2), 1000);
    const id = b.data.booking.id as string;
    const rs = await Promise.all(Array.from({ length: 6 }, () => act(pickup, id, { payments: [{ kind: "BALANCE", amount: 5500, mode: "CASH" }] })));
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    expect(rs.filter((r) => r.status !== 200).every((r) => r.status === 422)).toBe(true);
    expect(await n("SELECT COUNT(*) n FROM payments WHERE booking_id=? AND kind='BALANCE'", [id])).toBe(1);
  });

  it("return submitted 5x at once: one settlement, one care job, one refund payment", async () => {
    const id = await outOnRentOnGarment("ZT-ST3b");
    const rs = await Promise.all(Array.from({ length: 5 }, () =>
      act(ret, id, { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: "ZT-ST3B", nextAction: "DRY_CLEAN", vendorName: "Zt V" }], refund: { pay: true, mode: "CASH" } })));
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    expect(await n("SELECT COUNT(*) n FROM care_jobs WHERE booking_id=?", [id])).toBe(1);
    expect(await n("SELECT COUNT(*) n FROM payments WHERE booking_id=? AND kind='REFUND'", [id])).toBe(1);
  });

  it("pending refund paid 6x at once: exactly one REFUND row, deposit REFUNDED", async () => {
    const id = await outOnRentOnGarment("ZT-ST4b");
    expect((await act(ret, id, { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: "ZT-ST4B", nextAction: "AVAILABLE" }] })).status).toBe(200);
    const rs = await Promise.all(Array.from({ length: 6 }, () => act(pay, id, { kind: "REFUND", amount: 2500, mode: "CASH" })));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await n("SELECT COUNT(*) n FROM payments WHERE booking_id=? AND kind='REFUND'", [id])).toBe(1);
    expect(String((await q("SELECT deposit_status s FROM bookings WHERE id=?", [id]))[0].s)).toBe("REFUNDED");
  });

  it("EXTRA owed 300 paid as 6 x 100 at once: exactly 3 accepted, never over-collects", async () => {
    const id = await outOnRentOnGarment("ZT-ST5b");
    await db().execute({ sql: "UPDATE bookings SET return_due_date=?, pickup_date=? WHERE id=?", args: [addDays(today, -3), addDays(today, -6), id] });
    await db().execute({ sql: "UPDATE booking_items SET return_due_date=?, pickup_date=? WHERE booking_id=?", args: [addDays(today, -3), addDays(today, -6), id] });
    const r = await act(ret, id, { actualReturnDate: today, damageCharge: 1000, cleaningCharge: 0, items: [{ garmentId: "ZT-ST5B", nextAction: "DAMAGED" }] });
    expect(r.data.settlement.additionalDue).toBe(300);
    const rs = await Promise.all(Array.from({ length: 6 }, () => act(pay, id, { kind: "EXTRA", amount: 100, mode: "UPI" })));
    expect(rs.filter((x) => x.status === 201)).toHaveLength(3);
    expect(await n("SELECT COALESCE(SUM(amount),0) n FROM payments WHERE booking_id=? AND kind='EXTRA'", [id])).toBe(300);
  });

  it("balance paid 8 x 1000 on a 5500 balance at once: collected total never exceeds what is owed", async () => {
    const b = await book(["ZT-ST1"], addDays(today, 300), addDays(today, 302), 1000);
    const id = b.data.booking.id as string; // grand 6500, paid 1000 -> 5500 due
    const rs = await Promise.all(Array.from({ length: 8 }, () => act(pay, id, { kind: "BALANCE", amount: 1000, mode: "CASH" })));
    expect(rs.filter((x) => x.status === 201)).toHaveLength(5);
    expect(await n("SELECT COALESCE(SUM(amount),0) n FROM payments WHERE booking_id=? AND kind<>'REFUND'", [id])).toBe(6000);
  });

  it("cancel vs pickup race on one CONFIRMED booking: exactly one wins, state consistent", async () => {
    const b = await book(["ZT-ST2"], addDays(today, 400), addDays(today, 402), 1000);
    const id = b.data.booking.id as string;
    const rs = await Promise.all([
      act(cancel, id, {}),
      act(pickup, id, { payments: [{ kind: "BALANCE", amount: 5500, mode: "CASH" }] }),
    ]);
    // pickup of a future-dated booking may be refused by rule; whichever happened, the booking has one coherent status
    const st = String((await q("SELECT status s FROM bookings WHERE id=?", [id]))[0].s);
    expect(["CANCELLED", "OUT_ON_RENT"]).toContain(st);
    const active = await n("SELECT COUNT(*) n FROM booking_items WHERE booking_id=? AND active=1", [id]);
    expect(active).toBe(st === "CANCELLED" ? 0 : 1);
    expect(rs.filter((r) => r.status >= 500)).toHaveLength(0);
  });

  async function outOnRentOnGarment(id: string) {
    await db().execute({ sql: "INSERT OR IGNORE INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES (?,?,?,?,?,?,?)", args: [id.toUpperCase(), `G ${id}`, "Saree", "M", "R-9", 4000, 2500] });
    return outOnRent(id.toUpperCase());
  }
});

describe("final invariants after all storms", () => {
  it("database is internally consistent", invariants);
});
