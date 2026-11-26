import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as quote } from "@/app/api/v1/bookings/quote/route";
import { GET as listB, POST as createB } from "@/app/api/v1/bookings/route";
import { GET as getB } from "@/app/api/v1/bookings/[id]/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

let custId = "";
let A = "";
let S = "";
const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const year = new Date().getFullYear();

const body = (over: Record<string, unknown> = {}) => ({
  customer: { name: "Zt Customer", phone: "7999000001", city: "Bargarh" },
  eventName: "Wedding",
  eventDate: "2027-06-12",
  pickupDate: "2027-06-10",
  returnDueDate: "2027-06-12",
  garmentIds: ["ZT-GA"],
  advance: { amount: 2000, mode: "CASH" },
  ...over,
});

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await db().batch(
    [
      "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('ZT-GA','Zt Red Lehenga','Lehenga','M','A-1',5000,3000,25000)",
      "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('ZT-GB','Zt Sherwani','Sherwani','L','A-2',2000,1500,9000)",
      "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('ZT-GC','Zt Damaged','Gown','S','A-3',1000,500,3000)",
      "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('ZT-GD','Zt Race','Gown','S','A-4',1000,500,3000)",
      "UPDATE garments SET status='DAMAGED_REPAIR' WHERE id='ZT-GC'",
    ],
    "write",
  );
  S = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_staff", password: "TestPass#1" } }));
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(cleanup);

describe("quote", () => {
  it("totals come from DB prices: owner formula with extras and advance", async () => {
    const r = await H("POST", quote, "/api/v1/bookings/quote", {
      cookie: S,
      body: { garmentIds: ["ZT-GA", "ZT-GB"], pickupDate: "2027-06-10", returnDueDate: "2027-06-12", dryCleanCharge: 300, transitCharge: 200, advance: 2000 },
    });
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ rentalTotal: 7000, depositTotal: 4500, dryCleanCharge: 300, transitCharge: 200, grandTotal: 12000, advance: 2000, balanceDue: 10000, conflicts: [] });
  });
  it("client-sent prices are ignored", async () => {
    const r = await H("POST", quote, "/api/v1/bookings/quote", {
      cookie: S,
      body: { garmentIds: ["ZT-GA"], pickupDate: "2027-06-10", returnDueDate: "2027-06-12", rentalTotal: 1, rentalPrice: 1, depositTotal: 0 },
    });
    expect(r.data.rentalTotal).toBe(5000);
  });
  it("validation + unbookable garments", async () => {
    const q = (b: object) => H("POST", quote, "/api/v1/bookings/quote", { cookie: S, body: b });
    expect((await q({ garmentIds: [], pickupDate: "2027-06-10", returnDueDate: "2027-06-12" })).status).toBe(400);
    expect((await q({ garmentIds: ["ZT-GA"], pickupDate: "2027-06-12", returnDueDate: "2027-06-10" })).status).toBe(400);
    expect((await q({ garmentIds: ["ZT-GA"], pickupDate: "2027-02-30", returnDueDate: "2027-03-01" })).status).toBe(400);
    expect((await q({ garmentIds: ["ZT-GA"], pickupDate: "2027-01-01", returnDueDate: "2027-03-30" })).status).toBe(400); // > 30 days
    expect((await q({ garmentIds: ["ZT-NOPE"], pickupDate: "2027-06-10", returnDueDate: "2027-06-12" })).status).toBe(404);
    const dmg = await q({ garmentIds: ["ZT-GC"], pickupDate: "2027-06-10", returnDueDate: "2027-06-12" });
    expect(dmg.status).toBe(422);
    expect(dmg.data.error.message).toMatch(/ZT-GC/);
  });
  it("unauthenticated → 401", async () => {
    expect((await H("POST", quote, "/api/v1/bookings/quote", { body: {} })).status).toBe(401);
  });
});

describe("create booking", () => {
  let first = "";
  it("creates booking: id format, DB prices, advance payment, customer, derived money", async () => {
    const r = await H("POST", createB, "/api/v1/bookings", { cookie: S, body: { ...body(), rentalTotal: 1, grandTotal: 1 } });
    expect(r.status).toBe(201);
    const b = r.data.booking;
    first = b.id;
    expect(b.id).toMatch(new RegExp(`^BF-BK-${year}-\\d{3}$`));
    expect(b).toMatchObject({
      status: "CONFIRMED", rentalTotal: 5000, depositTotal: 3000, grandTotal: 8000, amountPaid: 2000, balanceDue: 6000, depositStatus: "HELD",
      customer: { name: "Zt Customer", phone: "7999000001", city: "Bargarh" },
    });
    expect(b.items).toHaveLength(1);
    expect(b.payments).toMatchObject([{ kind: "ADVANCE", amount: 2000, mode: "CASH" }]);
    custId = b.customer.id;
  });
  it("second booking gets the next sequential id", async () => {
    const r = await H("POST", createB, "/api/v1/bookings", { cookie: S, body: body({ garmentIds: ["ZT-GB"], customer: { name: "Zt Customer", phone: "7999000001" } }) });
    expect(r.status).toBe(201);
    const n = (id: string) => Number(id.split("-").pop());
    expect(n(r.data.booking.id)).toBe(n(first) + 1);
    expect(r.data.booking.customer.id).toBe(custId); // same phone → same customer
  });
  it("overlapping dates → 409 naming the holder and dates; nothing is written", async () => {
    const before = Number((await db().execute({ sql: "SELECT COUNT(*) n FROM bookings WHERE customer_id=?", args: [custId] })).rows[0].n);
    const r = await H("POST", createB, "/api/v1/bookings", {
      cookie: S, body: body({ pickupDate: "2027-06-11", returnDueDate: "2027-06-14", customer: { name: "Other", phone: "7999000002" } }),
    });
    expect(r.status).toBe(409);
    expect(r.data.error.code).toBe("GARMENT_CONFLICT");
    expect(r.data.error.message).toContain(first);
    expect(r.data.error.message).toMatch(/10 Jun 2027 – 12 Jun 2027/);
    expect(r.data.error.details.conflicts[0]).toMatchObject({ garmentId: "ZT-GA", heldBy: first, from: "2027-06-10", to: "2027-06-12" });
    const after = Number((await db().execute({ sql: "SELECT COUNT(*) n FROM bookings WHERE customer_id=?", args: [custId] })).rows[0].n);
    expect(after).toBe(before);
    expect((await db().execute("SELECT 1 FROM customers WHERE phone='7999000002'")).rows).toHaveLength(0); // customer insert rolled back
  });
  it("quote reports the same conflict before saving", async () => {
    const r = await H("POST", quote, "/api/v1/bookings/quote", { cookie: S, body: { garmentIds: ["ZT-GA"], pickupDate: "2027-06-13", returnDueDate: "2027-06-14" } });
    expect(r.data.conflicts).toHaveLength(1); // buffer day after return
    expect(r.data.conflicts[0].heldBy).toBe(first);
    const ok = await H("POST", quote, "/api/v1/bookings/quote", { cookie: S, body: { garmentIds: ["ZT-GA"], pickupDate: "2027-06-14", returnDueDate: "2027-06-15" } });
    expect(ok.data.conflicts).toHaveLength(0);
  });
  it("rules: advance > total, past pickup, damaged garment, bad phone", async () => {
    const mk = (over: object) => H("POST", createB, "/api/v1/bookings", { cookie: S, body: body({ garmentIds: ["ZT-GD"], pickupDate: "2027-08-01", returnDueDate: "2027-08-02", ...over }) });
    expect((await mk({ advance: { amount: 99999, mode: "CASH" } })).status).toBe(422);
    expect((await mk({ pickupDate: "2020-01-01", returnDueDate: "2020-01-02" })).status).toBe(400);
    expect((await mk({ garmentIds: ["ZT-GC"] })).status).toBe(422);
    expect((await mk({ customer: { name: "X", phone: "123" } })).status).toBe(400);
    expect((await mk({ advance: { amount: -5, mode: "CASH" } })).status).toBe(400);
    expect((await mk({ advance: { amount: 100, mode: "BITCOIN" } })).status).toBe(400);
  });
  it("zero advance is allowed and writes no payment row", async () => {
    const r = await H("POST", createB, "/api/v1/bookings", { cookie: S, body: body({ garmentIds: ["ZT-GD"], pickupDate: "2027-09-01", returnDueDate: "2027-09-02", advance: { amount: 0, mode: "CASH" } }) });
    expect(r.status).toBe(201);
    expect(r.data.booking.payments).toHaveLength(0);
    expect(r.data.booking.balanceDue).toBe(1500);
  });
});

describe("AC1: concurrent bookings of the same garment", () => {
  it("10 parallel create calls, same garment + dates → exactly 1 success, 9 × 409", async () => {
    const reqs = Array.from({ length: 10 }, (_, i) =>
      H("POST", createB, "/api/v1/bookings", {
        cookie: i % 2 ? S : A,
        body: body({ garmentIds: ["ZT-GD"], pickupDate: "2027-10-10", returnDueDate: "2027-10-12", advance: { amount: 500, mode: "UPI" }, customer: { name: `Racer ${i}`, phone: `7999100${String(i).padStart(3, "0")}` } }),
      }),
    );
    const res = await Promise.all(reqs);
    const codes = res.map((r) => r.status).sort();
    expect(codes.filter((c) => c === 201)).toHaveLength(1);
    expect(codes.filter((c) => c === 409)).toHaveLength(9);
    const rows = await db().execute("SELECT COUNT(*) n FROM booking_items WHERE garment_id='ZT-GD' AND pickup_date='2027-10-10'");
    expect(Number(rows.rows[0].n)).toBe(1);
    // losers left no half-written customers
    const racers = await db().execute("SELECT COUNT(*) n FROM customers WHERE name LIKE 'Racer %'");
    expect(Number(racers.rows[0].n)).toBe(1);
  });
});

describe("list + detail", () => {
  it("lists newest first, filters by status/customer/q, paginates", async () => {
    const all = await H("GET", listB, "/api/v1/bookings?q=7999000001", { cookie: S });
    expect(all.status).toBe(200);
    expect(all.data.bookings.length).toBeGreaterThanOrEqual(3);
    const p1 = await H("GET", listB, `/api/v1/bookings?customerId=${custId}&limit=2`, { cookie: S });
    expect(p1.data.bookings).toHaveLength(2);
    expect(p1.data.nextCursor).toBeTruthy();
    const p2 = await H("GET", listB, `/api/v1/bookings?customerId=${custId}&limit=2&cursor=${encodeURIComponent(p1.data.nextCursor)}`, { cookie: S });
    expect(p2.data.bookings.length).toBeGreaterThanOrEqual(1);
    const ids1 = p1.data.bookings.map((b: any) => b.id);
    expect(p2.data.bookings.some((b: any) => ids1.includes(b.id))).toBe(false);
    expect((await H("GET", listB, "/api/v1/bookings?status=COMPLETED&q=7999000001", { cookie: S })).data.bookings).toHaveLength(0);
    expect((await H("GET", listB, "/api/v1/bookings?status=NOPE", { cookie: S })).status).toBe(400);
  });
  it("detail by id; 404 for unknown", async () => {
    const list = await H("GET", listB, "/api/v1/bookings?q=7999000001", { cookie: S });
    const id = list.data.bookings[0].id;
    expect((await H("GET", getB, `/api/v1/bookings/${id}`, { cookie: S, params: { id } })).data.booking.id).toBe(id);
    expect((await H("GET", getB, "/api/v1/bookings/NOPE", { cookie: S, params: { id: "NOPE" } })).status).toBe(404);
  });
});
