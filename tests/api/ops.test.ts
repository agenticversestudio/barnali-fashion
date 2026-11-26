import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { addDays } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as listCare, POST as createCare } from "@/app/api/v1/care/route";
import { POST as receiveCare } from "@/app/api/v1/care/[id]/receive/route";
import { GET as alerts } from "@/app/api/v1/alerts/route";
import { GET as listExp, POST as createExp } from "@/app/api/v1/expenses/route";
import { DELETE as delExp, PATCH as patchExp } from "@/app/api/v1/expenses/[id]/route";
import { GET as cashToday } from "@/app/api/v1/cash/today/route";
import { POST as closeCash } from "@/app/api/v1/cash/closing/route";
import { GET as closings } from "@/app/api/v1/cash/closings/route";
import { GET as summary } from "@/app/api/v1/reports/summary/route";
import { GET as csv } from "@/app/api/v1/reports/export.csv/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

let A = "";
let S = "";
const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const today = todayIST();

async function sql(s: string, args: (string | number | null)[] = []) {
  return db().execute({ sql: s, args });
}
const booking = (id: string, status: string, pickup: string, due: string) =>
  sql(
    "INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,created_by) VALUES (?, 'ZT-C1','E',?,?,?,?,0,0,'ZT-A1')",
    [id, due, pickup, due, status],
  );

beforeAll(async () => {
  await cleanup();
  await db().execute("DELETE FROM cash_closings WHERE date LIKE '2025-03-%'");
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await sql("INSERT INTO customers(id,name,phone) VALUES ('ZT-C1','=Evil Name','7999000099')");
  for (const g of ["ZT-G1", "ZT-G2", "ZT-G3"]) await sql("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES (?,?,?,?,?,?,?)", [g, `Zt ${g}`, "Lehenga", "M", "R", 5000, 3000]);
  S = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_staff", password: "TestPass#1" } }));
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
});
afterAll(async () => {
  await db().execute("DELETE FROM cash_closings WHERE date LIKE '2025-03-%'");
  await cleanup();
});

describe("care jobs", () => {
  let job = "";
  it("create sends the garment IN_CARE; id format CARE-NNNN", async () => {
    const r = await H("POST", createCare, "/api/v1/care", { cookie: S, body: { garmentId: "zt-g1", kind: "STITCHING", vendorName: "Ramesh Tailor", subType: "Hem alteration", outDate: today, expectedDate: addDays(today, 3), cost: 250 } });
    expect(r.status).toBe(201);
    job = r.data.job.id;
    expect(job).toMatch(/^CARE-\d{4}$/);
    expect(r.data.job).toMatchObject({ garmentId: "ZT-G1", kind: "STITCHING", status: "OUT", isOverdue: false, garmentName: "Zt ZT-G1" });
    expect(String((await sql("SELECT status FROM garments WHERE id='ZT-G1'")).rows[0].status)).toBe("IN_CARE");
  });
  it("rules: out-on-rent garment refused, bad kind/date → 400, unknown garment → 404", async () => {
    await sql("UPDATE garments SET status='OUT_ON_RENT' WHERE id='ZT-G3'");
    const base = { kind: "DRY_CLEAN", vendorName: "V", outDate: today };
    expect((await H("POST", createCare, "/api/v1/care", { cookie: S, body: { ...base, garmentId: "ZT-G3" } })).status).toBe(422);
    expect((await H("POST", createCare, "/api/v1/care", { cookie: S, body: { ...base, garmentId: "ZT-G2", kind: "WASH" } })).status).toBe(400);
    expect((await H("POST", createCare, "/api/v1/care", { cookie: S, body: { ...base, garmentId: "ZT-G2", expectedDate: addDays(today, -2) } })).status).toBe(400);
    expect((await H("POST", createCare, "/api/v1/care", { cookie: S, body: { ...base, garmentId: "ZT-NOPE" } })).status).toBe(404);
    await sql("UPDATE garments SET status='AVAILABLE' WHERE id='ZT-G3'");
  });
  it("list filters by kind/status; overdue flag from expected date", async () => {
    const od = await H("POST", createCare, "/api/v1/care", { cookie: S, body: { garmentId: "ZT-G2", kind: "DRY_CLEAN", vendorName: "Maa Cleaners", outDate: addDays(today, -5), expectedDate: addDays(today, -1) } });
    expect(od.data.job.isOverdue).toBe(true);
    const l = await H("GET", listCare, "/api/v1/care?kind=DRY_CLEAN&status=OUT", { cookie: S });
    expect(l.data.jobs.some((j: any) => j.id === od.data.job.id && j.isOverdue)).toBe(true);
    expect(l.data.jobs.every((j: any) => j.kind === "DRY_CLEAN")).toBe(true);
    expect((await H("GET", listCare, "/api/v1/care?status=NOPE", { cookie: S })).status).toBe(400);
  });
  it("receive: job RECEIVED, garment back to chosen status; double receive → 422", async () => {
    const r = await H("POST", receiveCare, `/api/v1/care/${job}/receive`, { cookie: S, params: { id: job }, body: { rcvDate: today, cost: 300, nextStatus: "AVAILABLE" } });
    expect(r.status).toBe(200);
    expect(r.data.job).toMatchObject({ status: "RECEIVED", rcvDate: today, cost: 300 });
    expect(String((await sql("SELECT status FROM garments WHERE id='ZT-G1'")).rows[0].status)).toBe("AVAILABLE");
    expect((await H("POST", receiveCare, `/api/v1/care/${job}/receive`, { cookie: S, params: { id: job }, body: { rcvDate: today, nextStatus: "AVAILABLE" } })).status).toBe(422);
  });
  it("garment with two open jobs stays IN_CARE until the last is received", async () => {
    const a = (await H("POST", createCare, "/api/v1/care", { cookie: S, body: { garmentId: "ZT-G1", kind: "DRY_CLEAN", vendorName: "V", outDate: today } })).data.job.id;
    const b = (await H("POST", createCare, "/api/v1/care", { cookie: S, body: { garmentId: "ZT-G1", kind: "REPAIR", vendorName: "V", outDate: today } })).data.job.id;
    await H("POST", receiveCare, `/api/v1/care/${a}/receive`, { cookie: S, params: { id: a }, body: { rcvDate: today, nextStatus: "AVAILABLE" } });
    expect(String((await sql("SELECT status FROM garments WHERE id='ZT-G1'")).rows[0].status)).toBe("IN_CARE");
    await H("POST", receiveCare, `/api/v1/care/${b}/receive`, { cookie: S, params: { id: b }, body: { rcvDate: today, nextStatus: "RETURNED_CLEANING" } });
    expect(String((await sql("SELECT status FROM garments WHERE id='ZT-G1'")).rows[0].status)).toBe("RETURNED_CLEANING");
  });
});

describe("alerts", () => {
  it("pickups ≤2 days, returns due/overdue, care overdue, refunds pending", async () => {
    await booking("ZT-BA1", "CONFIRMED", addDays(today, 1), addDays(today, 3));
    await booking("ZT-BA2", "CONFIRMED", addDays(today, 10), addDays(today, 12)); // too far: no alert
    await booking("ZT-BA3", "OUT_ON_RENT", addDays(today, -5), addDays(today, -2)); // overdue
    await booking("ZT-BA4", "OUT_ON_RENT", addDays(today, -3), addDays(today, 1)); // due tomorrow
    await booking("ZT-BA5", "COMPLETED", addDays(today, -9), addDays(today, -7));
    await sql("UPDATE bookings SET deposit_status='HELD', refund_amount=1500 WHERE id='ZT-BA5'");
    const r = await H("GET", alerts, "/api/v1/alerts", { cookie: S });
    expect(r.status).toBe(200);
    const by = (t: string) => r.data.alerts.filter((a: any) => a.type === t).map((a: any) => a.refId);
    expect(by("PICKUP_SOON")).toContain("ZT-BA1");
    expect(by("PICKUP_SOON")).not.toContain("ZT-BA2");
    expect(by("RETURN_OVERDUE")).toContain("ZT-BA3");
    expect(by("RETURN_DUE")).toContain("ZT-BA4");
    expect(by("REFUND_PENDING")).toContain("ZT-BA5");
    expect(r.data.alerts.find((a: any) => a.refId === "ZT-BA5").message).toMatch(/1500/);
    expect(by("CARE_OVERDUE").length).toBeGreaterThanOrEqual(1); // Maa Cleaners job from the care tests
    expect((await H("GET", alerts, "/api/v1/alerts")).status).toBe(401);
  });
});

describe("expenses (admin only)", () => {
  let id = "";
  it("staff blocked; admin creates, lists, edits, deletes with audit", async () => {
    expect((await H("GET", listExp, "/api/v1/expenses", { cookie: S })).status).toBe(403);
    expect((await H("POST", createExp, "/api/v1/expenses", { cookie: S, body: {} })).status).toBe(403);
    const c = await H("POST", createExp, "/api/v1/expenses", { cookie: A, body: { date: "2025-02-10", category: "Zt Packaging", description: "Dust bags", amount: 750, mode: "CASH", receiptNo: "R-1" } });
    expect(c.status).toBe(201);
    id = c.data.expense.id;
    expect(id).toMatch(/^EXP-\d{4}$/);
    expect((await H("GET", listExp, "/api/v1/expenses?from=2025-02-01&to=2025-02-28&category=zt", { cookie: A })).data.expenses.map((e: any) => e.id)).toContain(id);
    const p = await H("PATCH", patchExp, `/api/v1/expenses/${id}`, { cookie: A, params: { id }, body: { amount: 800 } });
    expect(p.data.expense.amount).toBe(800);
    const a = await sql("SELECT before,after FROM audit_log WHERE action='expense.edit' AND entity_id=?", [id]);
    expect(JSON.parse(String(a.rows[0].before)).amount).toBe(750);
    expect((await H("DELETE", delExp, `/api/v1/expenses/${id}`, { cookie: A, params: { id } })).status).toBe(200);
    expect((await H("DELETE", delExp, `/api/v1/expenses/${id}`, { cookie: A, params: { id } })).status).toBe(404);
    expect((await sql("SELECT 1 FROM audit_log WHERE action='expense.delete' AND entity_id=?", [id])).rows).toHaveLength(1);
  });
  it("validation", async () => {
    const b = { date: "2025-02-10", category: "c", description: "d", amount: 10, mode: "CASH" };
    for (const bad of [{ amount: 0 }, { amount: 1.5 }, { mode: "CARD" }, { date: "2025-13-01" }]) expect((await H("POST", createExp, "/api/v1/expenses", { cookie: A, body: { ...b, ...bad } })).status).toBe(400);
  });
});

describe("cash closing: expected cash reconciles with a hand example", () => {
  const D1 = "2025-03-01";
  const D2 = "2025-03-02";
  beforeAll(async () => {
    await booking("ZT-BC1", "COMPLETED", "2025-02-27", "2025-03-01");
    const pay = (kind: string, amount: number, mode: string, d: string) =>
      sql("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-BC1',?,?,?,?,'ZT-A1')", [kind, amount, mode, d]);
    await pay("ADVANCE", 2000, "CASH", D1);
    await pay("BALANCE", 3000, "CASH", D1);
    await pay("ADVANCE", 9999, "UPI", D1); // not cash: ignored
    await pay("REFUND", 500, "CASH", D1);
    await pay("EXTRA", 1000, "CASH", D2);
    await sql("INSERT INTO expenses(id,date,category,description,amount,mode,recorded_by) VALUES ('ZT-E1',?,'x','cash exp',400,'CASH','ZT-A1'),('ZT-E2',?,'x','upi exp',800,'UPI','ZT-A1')", [D1, D1]);
  });
  it("open day is computed live: 0 + 5000 − 500 − 400 = 4100", async () => {
    const r = await H("GET", cashToday, `/api/v1/cash/today?date=${D1}`, { cookie: A });
    expect(r.data).toMatchObject({ date: D1, openingCash: 0, cashIn: 5000, cashRefunds: 500, cashExpenses: 400, expectedCash: 4100, closed: false });
  });
  it("staff cannot read or close cash", async () => {
    expect((await H("GET", cashToday, "/api/v1/cash/today", { cookie: S })).status).toBe(403);
    expect((await H("POST", closeCash, "/api/v1/cash/closing", { cookie: S, body: { actualCash: 1 } })).status).toBe(403);
    expect((await H("GET", closings, "/api/v1/cash/closings", { cookie: S })).status).toBe(403);
  });
  it("closing stores variance = actual − expected; duplicate day refused; client cannot set expected", async () => {
    const r = await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: D1, actualCash: 4000, expectedCash: 9, notes: "short by 100" } });
    expect(r.status).toBe(201);
    expect(r.data.closing).toMatchObject({ id: `CC-${D1}`, expectedCash: 4100, actualCash: 4000, variance: -100, notes: "short by 100" });
    expect((await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: D1, actualCash: 4100 } })).status).toBe(422);
  });
  it("a closed day is frozen even if a late payment is added; expenses of that day are locked", async () => {
    await sql("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-BC1','EXTRA',77,'CASH',?,'ZT-A1')", [D1]);
    const r = await H("GET", cashToday, `/api/v1/cash/today?date=${D1}`, { cookie: A });
    expect(r.data).toMatchObject({ closed: true, expectedCash: 4100 });
    expect((await H("PATCH", patchExp, "/api/v1/expenses/ZT-E1", { cookie: A, params: { id: "ZT-E1" }, body: { amount: 1 } })).status).toBe(422);
  });
  it("next day opens with the previous counted cash: 4000 + 1000 = 5000", async () => {
    const r = await H("GET", cashToday, `/api/v1/cash/today?date=${D2}`, { cookie: A });
    expect(r.data).toMatchObject({ openingCash: 4000, cashIn: 1000, expectedCash: 5000, closed: false });
    const list = await H("GET", closings, "/api/v1/cash/closings?from=2025-03-01&to=2025-03-31", { cookie: A });
    expect(list.data.closings.map((c: any) => c.date)).toEqual([D1]);
  });
  it("cannot close a future day", async () => {
    expect((await H("POST", closeCash, "/api/v1/cash/closing", { cookie: A, body: { date: addDays(today, 2), actualCash: 0 } })).status).toBe(400);
  });
});

describe("reports summary (hand-calculated)", () => {
  const F = "2025-04-01";
  const T = "2025-04-30";
  beforeAll(async () => {
    await sql("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,dry_clean_charge,transit_charge,damage_charge,cleaning_charge,late_fee,created_by) VALUES ('ZT-BR1','ZT-C1','E','2025-04-12','2025-04-10','2025-04-12','COMPLETED',5000,3000,300,200,500,300,750,'ZT-A1')");
    await sql("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,created_by) VALUES ('ZT-BR2','ZT-C1','E','2025-04-21','2025-04-20','2025-04-21','CONFIRMED',2000,1000,'ZT-A1')");
    await sql("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,status,rental_total,deposit_total,created_by) VALUES ('ZT-BR3','ZT-C1','E','2025-04-25','2025-04-24','2025-04-25','CANCELLED',9999,1000,'ZT-A1')");
    await sql("INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date,active) VALUES ('ZT-BR1','ZT-G1',5000,3000,'2025-04-10','2025-04-12',0),('ZT-BR2','ZT-G2',2000,1000,'2025-04-20','2025-04-21',1),('ZT-BR3','ZT-G3',9999,1000,'2025-04-24','2025-04-25',0)");
    await sql("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('ZT-BR1','ADVANCE',2000,'CASH','2025-04-10','ZT-A1'),('ZT-BR1','BALANCE',6000,'UPI','2025-04-10','ZT-A1'),('ZT-BR3','ADVANCE',1500,'CASH','2025-04-24','ZT-A1'),('ZT-BR3','REFUND',500,'CASH','2025-04-25','ZT-A1')");
    await sql("INSERT INTO expenses(id,date,category,description,amount,mode,recorded_by) VALUES ('ZT-ER1','2025-04-15','Dry Cleaning','d',1000,'CASH','ZT-A1'),('ZT-ER2','2025-04-16','Packaging','p',500,'UPI','ZT-A1')");
  });
  it("revenue, expenses, profit, cash, bookings, top garments, utilisation", async () => {
    const r = await H("GET", summary, `/api/v1/reports/summary?from=${F}&to=${T}`, { cookie: A });
    expect(r.status).toBe(200);
    const d = r.data;
    // revenue: rental 5000+2000, dry 300, transit 200, late 750, damage+cleaning 800, cancelled advance kept 1500−500
    expect(d.revenue).toEqual({ rental: 7000, dryClean: 300, transit: 200, lateFees: 750, damageAndCleaning: 800, cancellationIncome: 1000, total: 10050 });
    expect(d.expenses).toEqual({ total: 1500, byCategory: [{ category: "Dry Cleaning", amount: 1000 }, { category: "Packaging", amount: 500 }] });
    expect(d.profit).toBe(8550);
    expect(d.cashCollected).toBe(2000 + 6000 + 1500 - 500);
    expect(d.bookings).toEqual({ total: 3, confirmed: 1, outOnRent: 0, completed: 1, cancelled: 1 });
    expect(d.topGarments[0]).toMatchObject({ garmentId: "ZT-G1", timesRented: 1, revenue: 5000 });
    expect(d.topGarments.map((g: any) => g.garmentId)).not.toContain("ZT-G3"); // cancelled
    expect(d.utilisation.bookedDays).toBe(3 + 2); // BR1 3 days, BR2 2 days (cancelled ignored)
    expect(d.utilisation.availableDays).toBe(d.utilisation.garments * 30);
    expect(d.utilisation.percent).toBeCloseTo((5 / (d.utilisation.garments * 30)) * 100, 1);
  });
  it("utilisation clips bookings to the window", async () => {
    const r = await H("GET", summary, "/api/v1/reports/summary?from=2025-04-11&to=2025-04-20", { cookie: A });
    expect(r.data.utilisation.bookedDays).toBe(2 + 1); // BR1 Apr 11-12, BR2 Apr 20
  });
  it("staff 403; bad range 400", async () => {
    expect((await H("GET", summary, "/api/v1/reports/summary", { cookie: S })).status).toBe(403);
    expect((await H("GET", summary, "/api/v1/reports/summary?from=2025-05-01&to=2025-04-01", { cookie: A })).status).toBe(400);
    expect((await H("GET", summary, "/api/v1/reports/summary?from=2020-01-01&to=2025-04-01", { cookie: A })).status).toBe(400);
  });
});

describe("csv export", () => {
  it("admin gets CSV with BOM, header, and formula-injection guard", async () => {
    const res = await csv(new Request("http://localhost/api/v1/reports/export.csv?type=bookings", { headers: { cookie: A } }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM so Excel reads ₹ / Odia names
    const t = await res.text(); // decoder strips the BOM
    expect(t).toMatch(/^id,status,customer,/);
    expect(t).toContain("'=Evil Name"); // customer name starting with = is neutralised
    expect(t).not.toMatch(/,=Evil Name/);
  });
  it("staff 403; missing/invalid type 400", async () => {
    const get = (t: string, c: string) => csv(new Request(`http://localhost/api/v1/reports/export.csv${t}`, { headers: { cookie: c } }));
    expect((await get("?type=bookings", S)).status).toBe(403);
    expect((await get("", A)).status).toBe(400);
    expect((await get("?type=users", A)).status).toBe(400);
  });
});
