/**
 * AC4: a staff token gets 403 on every admin endpoint and no financial field in any response.
 * The route list is discovered from disk, so a NEW route that is in neither list below fails this test:
 * whoever adds it must decide consciously whether staff may use it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addDays } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { db } from "@/server/db";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

type Mod = Record<string, (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>>;
process.env.STORAGE_DRIVER = "fake";
const modules = import.meta.glob("../../src/app/api/v1/**/route.ts", { eager: true }) as Record<string, Mod>;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** "METHOD /api/v1/path" that staff MAY call. */
const STAFF_OK = new Set([
  "GET /api/v1/auth/me",
  "GET /api/v1/garments", "GET /api/v1/garments/availability", "GET /api/v1/garments/[id]",
  "PATCH /api/v1/garments/[id]/location", "PATCH /api/v1/garments/[id]/status",
  "GET /api/v1/customers", "POST /api/v1/customers", "GET /api/v1/customers/[id]", "PATCH /api/v1/customers/[id]",
  "POST /api/v1/bookings/quote", "GET /api/v1/bookings", "POST /api/v1/bookings", "GET /api/v1/bookings/[id]", "PATCH /api/v1/bookings/[id]",
  "POST /api/v1/bookings/[id]/pickup", "POST /api/v1/bookings/[id]/return", "POST /api/v1/bookings/[id]/payments",
  "GET /api/v1/care", "POST /api/v1/care", "POST /api/v1/care/[id]/receive",
  "GET /api/v1/alerts",
  "POST /api/v1/photos/presign", "POST /api/v1/photos",
]);
/** callable without a session */
const PUBLIC = new Set(["GET /api/v1/health", "POST /api/v1/auth/login", "POST /api/v1/auth/logout"]);

const routes: { key: string; path: string; method: string; fn: Mod[string] }[] = [];
for (const [file, mod] of Object.entries(modules)) {
  const path = "/" + file.replace(/^.*src\/app\//, "").replace(/\/route\.ts$/, "");
  for (const m of METHODS) if (typeof mod[m] === "function") routes.push({ key: `${m} ${path}`, path, method: m, fn: mod[m] });
}

const concrete = (path: string, ids: Record<string, string>) => path.replace("[id]", ids.id ?? "ZT-NOPE");
let A = "";
let S = "";
let bookingId = "";
const FORBIDDEN_IN_STAFF = [/purchaseCost/, /purchase_cost/, /"profit"/, /"revenue"/, /totalSpent/, /password_hash/, /pbkdf2/, /token_hash/, /"expenses"/, /"cashIn"/, /expectedCash/];

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await db().execute("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('ZT-G1','Zt G1','Lehenga','M','R',5000,3000,12345)");
  const H = (m: string, h: unknown, p: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, p, o);
  S = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_staff", password: "TestPass#1" } }));
  A = cookieOf(await H("POST", login, "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
  const create = routes.find((r) => r.key === "POST /api/v1/bookings")!;
  const today = todayIST();
  const b = await call(create.fn as never, "POST", "/api/v1/bookings", {
    cookie: S, body: { customer: { name: "Zt Fuzz", phone: "7999000077" }, eventName: "E", eventDate: addDays(today, 3), pickupDate: today, returnDueDate: addDays(today, 3), garmentIds: ["ZT-G1"], advance: { amount: 2000, mode: "CASH" } },
  });
  expect(b.status).toBe(201);
  bookingId = b.data.booking.id;
});
afterAll(cleanup);

describe("route inventory", () => {
  it("discovers the API from disk (guards against the glob silently finding nothing)", () => {
    expect(routes.length).toBeGreaterThan(30);
  });
  it("every route is classified: PUBLIC, STAFF_OK, or admin-only (default)", () => {
    const stale = [...STAFF_OK, ...PUBLIC].filter((k) => !routes.some((r) => r.key === k));
    expect(stale).toEqual([]); // lists must not reference routes that no longer exist
  });
});

describe("no session → 401 everywhere except public routes", () => {
  for (const r of routes.filter((r) => !PUBLIC.has(r.key) && !r.path.includes("/cron/"))) {
    it(r.key, async () => {
      const res = await call(r.fn as never, r.method, concrete(r.path, { id: "ZT-X" }), { params: { id: "ZT-X" }, body: r.method === "GET" ? undefined : {} });
      expect(res.status).toBe(401);
    });
  }
});

describe("staff token: 403 on every admin-only route", () => {
  for (const r of routes.filter((r) => !PUBLIC.has(r.key) && !STAFF_OK.has(r.key) && !r.path.includes("/cron/"))) {
    it(r.key, async () => {
      const res = await call(r.fn as never, r.method, concrete(r.path, { id: "ZT-X" }) + (r.path.includes("export.csv") ? "?type=bookings" : ""), {
        cookie: S, params: { id: "ZT-X" }, body: r.method === "GET" ? undefined : {},
      });
      expect(res.status).toBe(403);
    });
  }
});

describe("admin token reaches every admin route (not 401/403)", () => {
  for (const r of routes.filter((r) => !PUBLIC.has(r.key) && !r.path.includes("/cron/") && !r.path.includes("/sync/"))) {
    it(r.key, async () => {
      const res = await call(r.fn as never, r.method, concrete(r.path, { id: "ZT-NOPE" }) + (r.path.includes("export.csv") ? "?type=bookings" : ""), {
        cookie: A, params: { id: "ZT-NOPE" }, body: r.method === "GET" ? undefined : {},
      });
      expect([401, 403, 500]).not.toContain(res.status);
    });
  }
});

describe("staff responses contain no financial / secret fields", () => {
  const reads = [
    "/api/v1/garments", "/api/v1/garments/ZT-G1", "/api/v1/garments/availability?from=2027-01-01&to=2027-01-31",
    "/api/v1/customers", "/api/v1/bookings", "/api/v1/care", "/api/v1/alerts", "/api/v1/auth/me",
  ];
  for (const p of reads) {
    it(`GET ${p}`, async () => {
      const key = "GET " + p.split("?")[0].replace("ZT-G1", "[id]");
      const r = routes.find((x) => x.key === key)!;
      expect(r, key).toBeTruthy();
      const res = await call(r.fn as never, "GET", p, { cookie: S, params: { id: "ZT-G1" } });
      expect(res.status).toBe(200);
      const text = JSON.stringify(res.data);
      for (const bad of FORBIDDEN_IN_STAFF) expect(text, String(bad)).not.toMatch(bad);
      expect(text).not.toContain("12345"); // the purchase cost value itself
    });
  }
  it("GET /bookings/:id and /customers/:id as staff", async () => {
    const b = routes.find((x) => x.key === "GET /api/v1/bookings/[id]")!;
    const bt = JSON.stringify((await call(b.fn as never, "GET", `/api/v1/bookings/${bookingId}`, { cookie: S, params: { id: bookingId } })).data);
    for (const bad of FORBIDDEN_IN_STAFF) expect(bt).not.toMatch(bad);
    const custId = String((await db().execute({ sql: "SELECT customer_id FROM bookings WHERE id=?", args: [bookingId] })).rows[0].customer_id);
    const c = routes.find((x) => x.key === "GET /api/v1/customers/[id]")!;
    const ct = JSON.stringify((await call(c.fn as never, "GET", `/api/v1/customers/${custId}`, { cookie: S, params: { id: custId } })).data);
    for (const bad of FORBIDDEN_IN_STAFF) expect(ct).not.toMatch(bad);
  });
  it("sanity: the same garment read as admin DOES contain purchaseCost (fuzz is not vacuous)", async () => {
    const r = routes.find((x) => x.key === "GET /api/v1/garments/[id]")!;
    const res = await call(r.fn as never, "GET", "/api/v1/garments/ZT-G1", { cookie: A, params: { id: "ZT-G1" } });
    expect(JSON.stringify(res.data)).toMatch(/purchaseCost":12345/);
  });
});

describe("staff cannot escalate through allowed routes", () => {
  it("PATCH /bookings/:id money field → 403; PATCH garment status UNAVAILABLE → 403", async () => {
    const p = routes.find((x) => x.key === "PATCH /api/v1/bookings/[id]")!;
    expect((await call(p.fn as never, "PATCH", `/api/v1/bookings/${bookingId}`, { cookie: S, params: { id: bookingId }, body: { dryCleanCharge: 1 } })).status).toBe(403);
    const g = routes.find((x) => x.key === "PATCH /api/v1/garments/[id]/status")!;
    expect((await call(g.fn as never, "PATCH", "/api/v1/garments/ZT-G1/status", { cookie: S, params: { id: "ZT-G1" }, body: { status: "UNAVAILABLE" } })).status).toBe(403);
  });
});
