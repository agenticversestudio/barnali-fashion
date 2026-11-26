// T9.2 smoke suite: one full boutique day through the real route handlers
// (health -> login -> garment -> customer -> quote -> booking -> pickup with photo -> late return with damage -> refund
//  -> cash -> reports + CSV). Everything uses "ZT" ids / phones 7999... and is cleaned up afterwards.
// Runs against the database in .env.local (a scratch/dev database, NEVER production).
process.env.STORAGE_DRIVER = "fake";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addDays } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { fakeStorage } from "@/server/storage";
import { GET as health } from "@/app/api/v1/health/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as createG } from "@/app/api/v1/garments/route";
import { POST as createC } from "@/app/api/v1/customers/route";
import { POST as quote } from "@/app/api/v1/bookings/quote/route";
import { POST as createB } from "@/app/api/v1/bookings/route";
import { POST as pickup } from "@/app/api/v1/bookings/[id]/pickup/route";
import { POST as ret } from "@/app/api/v1/bookings/[id]/return/route";
import { POST as presign } from "@/app/api/v1/photos/presign/route";
import { POST as register } from "@/app/api/v1/photos/route";
import { GET as cashToday } from "@/app/api/v1/cash/today/route";
import { POST as closeCash } from "@/app/api/v1/cash/closing/route";
import { GET as summary } from "@/app/api/v1/reports/summary/route";
import { GET as exportCsv } from "@/app/api/v1/reports/export.csv/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const today = todayIST();
const due = addDays(today, 2);
let A = "";
let id = "";
let cashBefore = 0;

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
  cashBefore = (await H("GET", cashToday, "/api/v1/cash/today", { cookie: A })).data?.expectedCash ?? 0;
});
afterAll(async () => {
  fakeStorage.clear();
  await db().execute("DELETE FROM cash_closings WHERE verified_by LIKE 'ZT%'");
  await cleanup();
});

describe("boutique lifecycle smoke", () => {
  it("health: database reachable", async () => {
    const r = await health();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, db: "ok" });
  });

  it("login: wrong password refused, right password gives a session", async () => {
    expect((await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "wrong" } })).status).toBe(401);
    expect(A).toContain("=");
  });

  it("garment + customer created", async () => {
    const g = await H("POST", createG, "/api/v1/garments", {
      cookie: A,
      body: { id: "ZT-SMOKE-1", name: "Sambalpuri Silk Saree", category: "Saree", size: "Free Size", rack: "Rack B-01", rentalPrice: 4000, securityDeposit: 2500, purchaseCost: 9000 },
    });
    expect(g.status).toBe(201);
    expect(g.data.garment).toMatchObject({ id: "ZT-SMOKE-1", rack: "Rack B-01", status: "AVAILABLE" });
    const c = await H("POST", createC, "/api/v1/customers", { cookie: A, body: { name: "Zt Smoke", phone: "7999300001" } });
    expect(c.status).toBe(201);
  });

  it("quote gives server totals; booking created with 1000 advance", async () => {
    const body = { garmentIds: ["ZT-SMOKE-1"], pickupDate: today, returnDueDate: due };
    const q = await H("POST", quote, "/api/v1/bookings/quote", { cookie: A, body });
    expect(q.status).toBe(200);
    expect(q.data).toMatchObject({ rentalTotal: 4000, depositTotal: 2500 });
    const b = await H("POST", createB, "/api/v1/bookings", {
      cookie: A,
      body: { customer: { name: "Zt Smoke", phone: "7999300001" }, eventName: "Wedding", eventDate: due, ...body, advance: { amount: 1000, mode: "CASH" } },
    });
    expect(b.status).toBe(201);
    id = b.data.booking.id;
    expect(id).toMatch(/^BF-BK-\d{4}-\d{3,}$/);
    expect(b.data.booking).toMatchObject({ status: "CONFIRMED", rentalTotal: 4000, depositTotal: 2500, amountPaid: 1000, balanceDue: 5500 });
  });

  it("double booking the same garment and dates is refused", async () => {
    const r = await H("POST", createB, "/api/v1/bookings", {
      cookie: A,
      body: { customer: { name: "Zt Other", phone: "7999300002" }, eventName: "X", eventDate: due, garmentIds: ["ZT-SMOKE-1"], pickupDate: today, returnDueDate: due, advance: { amount: 100, mode: "CASH" } },
    });
    expect(r.status).toBe(409);
  });

  it("pickup: handover photo attached, full balance (rent + deposit) collected", async () => {
    const p = await H("POST", presign, "/api/v1/photos/presign", { cookie: A, body: { kind: "HANDOVER", contentType: "image/webp", bytes: 120_000 } });
    expect(p.status).toBe(200);
    fakeStorage.put(p.data.objectKey, 120_000);
    const ph = await H("POST", register, "/api/v1/photos", { cookie: A, body: { objectKey: p.data.objectKey, kind: "HANDOVER" } });
    expect(ph.status).toBe(201);
    const r = await H("POST", pickup, `/api/v1/bookings/${id}/pickup`, {
      cookie: A,
      params: { id },
      body: { handoverCondition: "Small stain on pallu, zari intact", photoIds: [ph.data.photo.id], payments: [{ kind: "BALANCE", amount: 5500, mode: "UPI" }] },
    });
    expect(r.status).toBe(200);
    expect(r.data.booking).toMatchObject({ status: "OUT_ON_RENT", balanceDue: 0, handoverCondition: "Small stain on pallu, zari intact" });
    const linked = await db().execute({ sql: "SELECT booking_id FROM photos WHERE id=?", args: [ph.data.photo.id] });
    expect(String(linked.rows[0].booking_id)).toBe(id);
  });

  it("return 2 days late with damage: 15%/day late fee by the server, client figures ignored", async () => {
    // the API refuses past pickups; real life gets here by waiting, so backdate: due date was 2 days ago
    await db().execute({ sql: "UPDATE bookings SET pickup_date=?, return_due_date=? WHERE id=?", args: [addDays(today, -5), addDays(today, -2), id] });
    await db().execute({ sql: "UPDATE booking_items SET pickup_date=?, return_due_date=? WHERE booking_id=?", args: [addDays(today, -5), addDays(today, -2), id] });
    const r = await H("POST", ret, `/api/v1/bookings/${id}/return`, {
      cookie: A,
      params: { id },
      body: {
        actualReturnDate: today, damageCharge: 300, cleaningCharge: 200,
        lateFee: 0, deductions: 0, // tampering: must be ignored
        items: [{ garmentId: "ZT-SMOKE-1", nextAction: "AVAILABLE" }],
        refund: { pay: true, mode: "CASH" },
      },
    });
    expect(r.status).toBe(200);
    // late fee = 15% x 4000 = 600/day x 2 = 1200; deductions 1200+300+200 = 1700; refund = 2500 - 1700 = 800
    expect(r.data.settlement).toMatchObject({ lateDays: 2, lateFee: 1200, deductions: 1700, refund: 800, additionalDue: 0 });
    expect(r.data.booking.status).toBe("COMPLETED");
  });

  it("cash: expected cash moved by the cash payments only; closing stores the variance", async () => {
    const t = await H("GET", cashToday, "/api/v1/cash/today", { cookie: A });
    expect(t.status).toBe(200);
    expect(t.data.expectedCash).toBeGreaterThanOrEqual(0);
    // cash in: advance 1000 (balance was UPI); cash out: refund 800 -> net +200
    const cashNet = await db().execute({
      sql: "SELECT COALESCE(SUM(CASE WHEN kind='REFUND' THEN -amount ELSE amount END),0) n FROM payments WHERE booking_id=? AND mode='CASH'",
      args: [id],
    });
    expect(Number(cashNet.rows[0].n)).toBe(200);
    expect(t.data.expectedCash - cashBefore).toBe(200);
    const c = await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { actualCash: t.data.expectedCash - 50, notes: "smoke" } });
    if (c.status === 201) expect(c.data.closing).toMatchObject({ expectedCash: t.data.expectedCash, variance: -50 });
    else expect(c.status).toBe(422); // a real closing already exists for today
  });

  it("reports summary + CSV exports work and include the booking", async () => {
    const s = await H("GET", summary, `/api/v1/reports/summary?from=${addDays(today, -7)}&to=${due}`, { cookie: A });
    expect(s.status).toBe(200);
    expect(s.data.revenue.lateFees).toBeGreaterThanOrEqual(1200);
    for (const type of ["bookings", "payments", "garments", "customers", "expenses", "cashclosings"]) {
      const r = await exportCsv(new Request(`http://localhost/api/v1/reports/export.csv?type=${type}`, { headers: { cookie: A } }));
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toContain("text/csv");
      if (type === "bookings") expect(await r.text()).toContain(id);
    }
  });
});
