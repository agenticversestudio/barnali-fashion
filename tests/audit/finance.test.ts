// Deep-audit finance suite: independent oracle for the money maths, date boundaries, full ledger scenarios, cash drawer property test.
process.env.STORAGE_DRIVER = "fake";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addDays, daysBetween, depositStatusAfter, lateDays, settle } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { computeCash } from "@/server/services/cash";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as createB } from "@/app/api/v1/bookings/route";
import { GET as getB } from "@/app/api/v1/bookings/[id]/route";
import { POST as pickup } from "@/app/api/v1/bookings/[id]/pickup/route";
import { POST as ret } from "@/app/api/v1/bookings/[id]/return/route";
import { POST as payHandler } from "@/app/api/v1/bookings/[id]/payments/route";
import { GET as alerts } from "@/app/api/v1/alerts/route";
import { GET as cashToday } from "@/app/api/v1/cash/today/route";
import { POST as closeCash } from "@/app/api/v1/cash/closing/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const today = todayIST();

// ---------------------------------------------------------------- pure maths against an independent oracle
describe("settle(): 2000 random cases vs an independently written oracle", () => {
  // deliberately different shape: integer maths only, no Math.round on percentages of the total
  const oracle = (dep: number, rent: number, dmg: number, cln: number, days: number, pct: number) => {
    const perDay = Math.floor((rent * pct + 50) / 100); // round-half-up of rent*pct/100 for integers
    const late = perDay * days;
    const ded = dmg + cln + late;
    return { lateFee: late, deductions: ded, refund: ded >= dep ? 0 : dep - ded, additionalDue: ded > dep ? ded - dep : 0 };
  };
  it("matches, and money is conserved: refund - additionalDue == deposit - deductions", () => {
    let seed = 20261126;
    const rnd = (m: number) => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed % m; };
    for (let i = 0; i < 2000; i++) {
      const dep = rnd(4) === 0 ? 0 : rnd(20000), rent = 1 + rnd(40000), dmg = rnd(5000), cln = rnd(1500), days = rnd(45), pct = [0, 5, 10, 15, 20][rnd(5)];
      const got = settle({ depositTotal: dep, rentalTotal: rent, damage: dmg, cleaning: cln, lateDays: days, latePercent: pct });
      expect(got).toEqual(oracle(dep, rent, dmg, cln, days, pct));
      expect(got.refund - got.additionalDue).toBe(dep - got.deductions);
      expect(got.refund === 0 || got.additionalDue === 0).toBe(true); // never both
      expect(got.refund).toBeGreaterThanOrEqual(0);
      expect(got.additionalDue).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("late-day boundaries (calendar days, no timezone drift)", () => {
  const cases: [string, string, number][] = [
    ["2026-11-26", "2026-11-26", 0], // same day: no fee
    ["2026-11-26", "2026-11-27", 1],
    ["2026-11-26", "2026-11-25", 0], // early: never negative
    ["2028-02-28", "2028-03-01", 2], // leap year: Feb 29 exists
    ["2027-02-28", "2027-03-01", 1], // non-leap
    ["2026-12-31", "2027-01-01", 1], // year end
    ["2026-01-31", "2026-03-01", 29], // month end skipping Feb
    ["2026-03-28", "2026-03-30", 2], // spring-forward date in many zones: must still be whole days
    ["2026-10-31", "2026-11-02", 2], // fall-back date in many zones
    ["2026-11-01", "2026-11-22", 21], // three weeks late
  ];
  for (const [due, back, want] of cases) it(`due ${due} back ${back} -> ${want}`, () => expect(lateDays(due, back)).toBe(want));
  it("daysBetween/addDays round-trip across 400 days", () => {
    for (let i = -200; i < 200; i++) expect(daysBetween("2027-12-15", addDays("2027-12-15", i))).toBe(i);
  });
  it("1 day / 21 days late fee at 15% of 4000 = 600/day", () => {
    const f = (d: number) => settle({ depositTotal: 2500, rentalTotal: 4000, damage: 0, cleaning: 0, lateDays: d, latePercent: 15 }).lateFee;
    expect([f(0), f(1), f(21)]).toEqual([0, 600, 12600]);
  });
  it("depositStatusAfter covers every branch", () => {
    expect(depositStatusAfter(2500, 2500, true)).toBe("REFUNDED");
    expect(depositStatusAfter(2500, 800, true)).toBe("PARTIALLY_REFUNDED");
    expect(depositStatusAfter(2500, 0, true)).toBe("FORFEITED");
    expect(depositStatusAfter(2500, 800, false)).toBe("HELD");
    expect(depositStatusAfter(0, 0, false)).toBe("NOT_COLLECTED");
  });
});

// ---------------------------------------------------------------- full ledger scenarios through the API
let A = "";
let phoneSeq = 0;
const nextPhone = () => `79995${String(100000 + phoneSeq++).slice(1)}`;
const act = (h: unknown, id: string, body: unknown) => H("POST", h, `/api/v1/bookings/${id}/x`, { cookie: A, params: { id }, body });
const get = async (id: string) => (await H("GET", getB, `/api/v1/bookings/${id}`, { cookie: A, params: { id } })).data.booking;
const rows = async (sql: string, args: (string | number)[] = []) => (await db().execute({ sql, args })).rows;
const ledger = async (id: string) => (await rows("SELECT kind, amount, mode FROM payments WHERE booking_id=? ORDER BY id", [id])).map((r) => `${r.kind}:${r.amount}:${r.mode}`);

/** book -> pickup -> (optionally backdate) so that it was due `lateBy` days ago, returns booking id */
async function life(garment: string, opts: { advance?: number; lateBy?: number; rent?: number; dep?: number } = {}) {
  const rent = opts.rent ?? 4000, dep = opts.dep ?? 2500;
  await db().execute({ sql: "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES (?,?,?,?,?,?,?)", args: [garment, garment, "Lehenga", "M", "R-1", rent, dep] });
  const b = await H("POST", createB, "/api/v1/bookings", {
    cookie: A,
    body: { customer: { name: "Zt Fin", phone: nextPhone() }, eventName: "E", eventDate: addDays(today, 2), garmentIds: [garment], pickupDate: today, returnDueDate: addDays(today, 2), advance: { amount: opts.advance ?? 1000, mode: "UPI" } },
  });
  expect(b.status).toBe(201);
  const id = b.data.booking.id as string;
  const due = rent + dep - (opts.advance ?? 1000);
  const p = await act(pickup, id, { payments: [{ kind: "BALANCE", amount: due, mode: "CASH" }] });
  expect(p.status).toBe(200);
  const late = opts.lateBy ?? 0;
  if (late > 0) {
    await db().execute({ sql: "UPDATE bookings SET pickup_date=?, return_due_date=? WHERE id=?", args: [addDays(today, -late - 3), addDays(today, -late), id] });
    await db().execute({ sql: "UPDATE booking_items SET pickup_date=?, return_due_date=? WHERE booking_id=?", args: [addDays(today, -late - 3), addDays(today, -late), id] });
  }
  return id;
}
const back = (id: string, garment: string, o: Record<string, unknown> = {}) =>
  act(ret, id, { actualReturnDate: today, damageCharge: 0, cleaningCharge: 0, items: [{ garmentId: garment, nextAction: "AVAILABLE" }], ...o });

beforeAll(async () => {
  await cleanup();
  await db().execute("DELETE FROM cash_closings WHERE id LIKE 'CC-2024-0%'");
  await mkUser("ZT-A1", "zt_admin", "admin");
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(async () => {
  await db().execute("DELETE FROM cash_closings WHERE id LIKE 'CC-2024-0%'");
  await cleanup();
});

describe("ledger scenarios (deposit 2500, rent 4000)", () => {
  it("a) deductions < deposit: clean refund; same-day return = no late fee; ledger nets to exactly the rent", async () => {
    const id = await life("ZT-FA", { lateBy: 0 });
    const r = await back(id, "ZT-FA", { damageCharge: 300, cleaningCharge: 200, refund: { pay: true, mode: "CASH" } });
    expect(r.data.settlement).toEqual({ lateDays: 0, lateFee: 0, deductions: 500, refund: 2000, additionalDue: 0, depositStatus: "PARTIALLY_REFUNDED" });
    expect(await ledger(id)).toEqual(["ADVANCE:1000:UPI", "BALANCE:5500:CASH", "REFUND:2000:CASH"]);
    const b = await get(id);
    expect(b).toMatchObject({ status: "COMPLETED", additionalDue: 0, balanceDue: 0, depositStatus: "PARTIALLY_REFUNDED" });
    // shop kept: rent 4000 + damage/cleaning 500 = 4500 = money in 6500 - money out 2000
  });

  it("b) deductions == deposit: refund 0, nothing owed, deposit fully absorbed", async () => {
    const id = await life("ZT-FB", { lateBy: 1 }); // 600 late
    const r = await back(id, "ZT-FB", { damageCharge: 1900, cleaningCharge: 0 });
    expect(r.data.settlement).toMatchObject({ lateFee: 600, deductions: 2500, refund: 0, additionalDue: 0, depositStatus: "FORFEITED" });
    expect(await ledger(id)).toEqual(["ADVANCE:1000:UPI", "BALANCE:5500:CASH"]); // no REFUND row
    expect((await pay(id, "REFUND", 1)).status).toBe(422); // nothing to pay out
    expect((await pay(id, "EXTRA", 1)).status).toBe(422); // nothing owed
  });

  it("c) deductions > deposit: customer owes the difference (additional_due), paid via EXTRA, in two parts", async () => {
    const id = await life("ZT-FC", { lateBy: 7 }); // 4200 late + 1000 damage = 5200 vs 2500
    const r = await back(id, "ZT-FC", { damageCharge: 1000 });
    expect(r.data.settlement).toMatchObject({ lateDays: 7, lateFee: 4200, deductions: 5200, refund: 0, additionalDue: 2700, depositStatus: "FORFEITED" });
    expect((await get(id)).additionalDue).toBe(2700);
    expect((await pay(id, "EXTRA", 2701)).status).toBe(422);
    expect((await pay(id, "EXTRA", 1700)).status).toBe(201);
    expect((await get(id)).additionalDue).toBe(1000); // remaining shown, not zero
    expect((await pay(id, "EXTRA", 1000)).status).toBe(201);
    expect((await get(id)).additionalDue).toBe(0);
    expect((await ledger(id)).filter((l) => l.startsWith("EXTRA"))).toEqual(["EXTRA:1700:CASH", "EXTRA:1000:CASH"]);
  });

  it("d) deferred refund: HELD + alert -> paid later -> REFUNDED, alert gone, paid exactly once, drawer sees it", async () => {
    const id = await life("ZT-FD", {});
    const r = await back(id, "ZT-FD"); // refund 2500 not paid now
    expect(r.data.settlement).toMatchObject({ refund: 2500, depositStatus: "HELD" });
    const alertsOf = async () => JSON.stringify((await H("GET", alerts, "/api/v1/alerts", { cookie: A })).data);
    expect(await alertsOf()).toContain(`"refId":"${id}"`);
    expect((await pay(id, "REFUND", 2499)).status).toBe(422);
    expect((await pay(id, "REFUND", 2501)).status).toBe(422);
    expect((await pay(id, "REFUND", 2500, "BANK_TRANSFER")).status).toBe(201);
    expect((await get(id)).depositStatus).toBe("REFUNDED");
    expect(await alertsOf()).not.toContain(`"refId":"${id}"`);
    expect((await pay(id, "REFUND", 2500)).status).toBe(422);
    expect((await ledger(id)).filter((l) => l.startsWith("REFUND"))).toEqual(["REFUND:2500:BANK_TRANSFER"]);
  });

  it("e) deferred partial refund ends PARTIALLY_REFUNDED (not REFUNDED)", async () => {
    const id = await life("ZT-FE", {});
    await back(id, "ZT-FE", { cleaningCharge: 500 });
    expect((await pay(id, "REFUND", 2000, "CASH")).status).toBe(201);
    expect((await get(id)).depositStatus).toBe("PARTIALLY_REFUNDED");
  });

  it("f) partial payments: advance + pickup balance + overpay refused; amountPaid/balanceDue stay consistent at every step", async () => {
    await db().execute({ sql: "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('ZT-FF','F','Saree','M','R-1',4000,2500)" });
    const b = await H("POST", createB, "/api/v1/bookings", {
      cookie: A,
      body: { customer: { name: "Zt Fin", phone: nextPhone() }, eventName: "E", eventDate: addDays(today, 2), garmentIds: ["ZT-FF"], pickupDate: today, returnDueDate: addDays(today, 2), advance: { amount: 2000, mode: "CASH" }, dryCleanCharge: 300, transitCharge: 200 },
    });
    const id = b.data.booking.id as string; // grand = 4000+2500+300+200 = 7000
    expect(b.data.booking).toMatchObject({ amountPaid: 2000, balanceDue: 5000 });
    expect((await pay(id, "BALANCE", 5001)).status).toBe(422);
    expect((await pay(id, "BALANCE", 1500, "UPI")).status).toBe(201);
    expect(await get(id)).toMatchObject({ amountPaid: 3500, balanceDue: 3500 });
    // pickup demands the rest, and refuses short money
    expect((await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 3000, mode: "CASH" }] })).status).toBe(422);
    expect((await act(pickup, id, { payments: [{ kind: "BALANCE", amount: 3500, mode: "CASH" }] })).status).toBe(200);
    expect(await get(id)).toMatchObject({ amountPaid: 7000, balanceDue: 0, status: "OUT_ON_RENT" });
  });
});
async function pay(id: string, kind: string, amount: number, mode = "CASH") {
  return act(payHandler, id, { kind, amount, mode });
}

// ---------------------------------------------------------------- cash drawer
describe("cash drawer: expectedCash = opening + cashIn - cashRefunds - cashExpenses; only CASH counts", () => {
  const D = (n: number) => `2024-05-${String(n).padStart(2, "0")}`;
  async function seedBooking() {
    await db().execute("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('ZT-FCASH','C','Saree','M','R',1000,500)");
    await db().execute("INSERT INTO customers(id,name,phone) VALUES ('ZT-CC1','C','0000000077')");
    await db().execute("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,created_by) VALUES ('ZT-BCASH','ZT-CC1','E','2024-05-02','2024-05-01','2024-05-02','COMPLETED',1000,500,'ZT-A1')");
  }
  it("random ledger (200 rows, all modes, refunds, expenses) equals a JS oracle; UPI/CARD/BANK never move the drawer", async () => {
    await seedBooking();
    let seed = 99;
    const rnd = (m: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % m; };
    const kinds = ["ADVANCE", "BALANCE", "DEPOSIT", "EXTRA", "REFUND"];
    const modes = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];
    let cin = 0, cout = 0, exp = 0, nonCash = 0;
    const stmts: { sql: string; args: (string | number)[] }[] = [];
    for (let i = 0; i < 200; i++) {
      const kind = kinds[rnd(5)], mode = modes[rnd(4)], amt = 1 + rnd(5000);
      if (mode === "CASH") { if (kind === "REFUND") cout += amt; else cin += amt; } else nonCash += amt;
      stmts.push({ sql: "INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-BCASH',?,?,?,?,'ZT-A1')", args: [kind, amt, mode, D(10)] });
    }
    for (let i = 0; i < 40; i++) {
      const mode = modes[rnd(4)], amt = 1 + rnd(2000);
      if (mode === "CASH") exp += amt;
      stmts.push({ sql: "INSERT INTO expenses(id,date,category,description,amount,mode,recorded_by) VALUES (?,?,?,?,?,?,'ZT-A1')", args: [`ZT-FE${i}`, D(10), "x", "x", amt, mode] });
    }
    await db().batch(stmts, "write");
    expect(nonCash).toBeGreaterThan(0);
    const c = await computeCash(db(), D(10), 1234);
    expect(c).toEqual({ openingCash: 1234, cashIn: cin, cashRefunds: cout, cashExpenses: exp, expectedCash: 1234 + cin - cout - exp });
    const t = await H("GET", cashToday, `/api/v1/cash/today?date=${D(10)}`, { cookie: A });
    expect(t.data).toMatchObject({ cashIn: cin, cashRefunds: cout, cashExpenses: exp, closed: false });
  });

  it("closing: negative, zero and positive variance stored with the right sign; day frozen; next day opens with counted cash", async () => {
    const expected = (await H("GET", cashToday, `/api/v1/cash/today?date=${D(10)}`, { cookie: A })).data.expectedCash as number;
    const neg = await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: D(10), actualCash: expected - 70 } });
    expect(neg.status).toBe(201);
    expect(neg.data.closing).toMatchObject({ expectedCash: expected, actualCash: expected - 70, variance: -70 });
    // zero variance on another day
    const z = await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: D(11), actualCash: expected - 70 } }); // opening = previous counted, no activity
    expect(z.data.closing).toMatchObject({ openingCash: expected - 70, expectedCash: expected - 70, variance: 0 });
    // positive variance
    const p = await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: D(12), actualCash: expected - 70 + 15 } });
    expect(p.data.closing).toMatchObject({ openingCash: expected - 70, variance: 15 });
    // frozen: a late payment on a closed day does not change the stored closing
    await db().execute({ sql: "INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-BCASH','EXTRA',999,'CASH',?,'ZT-A1')", args: [D(10)] });
    const again = await H("GET", cashToday, `/api/v1/cash/today?date=${D(10)}`, { cookie: A });
    expect(again.data).toMatchObject({ closed: true, expectedCash: expected });
  });
});
