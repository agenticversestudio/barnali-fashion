/**
 * AC6: p95 < 500 ms on key endpoints. Runs the real route handlers against the real Turso DB, so the number includes
 * network round trips from THIS machine (production runs in Vercel bom1 next to Turso Mumbai, which is faster).
 * Opt-in: PERF_LATENCY=1 npx vitest run tests/perf   (skipped in normal runs to keep the suite fast).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@tursodatabase/serverless/compat";
import { addDays } from "@/server/pricing";
import { todayIST } from "@/server/ids";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as garments } from "@/app/api/v1/garments/route";
import { GET as availability } from "@/app/api/v1/garments/availability/route";
import { GET as customers } from "@/app/api/v1/customers/route";
import { GET as bookings, POST as createBooking } from "@/app/api/v1/bookings/route";
import { GET as booking } from "@/app/api/v1/bookings/[id]/route";
import { POST as quote } from "@/app/api/v1/bookings/quote/route";
import { GET as alerts } from "@/app/api/v1/alerts/route";
import { GET as care } from "@/app/api/v1/care/route";
import { GET as cashToday } from "@/app/api/v1/cash/today/route";
import { GET as report } from "@/app/api/v1/reports/summary/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const RUNS = Number(process.env.PERF_RUNS ?? 20);
const BUDGET_MS = 500;
const on = process.env.PERF_LATENCY === "1";

let queries = 0;
if (on) {
  const proto = Object.getPrototypeOf(createClient({ url: "https://count.invalid", authToken: "x" })) as Record<string, (...a: unknown[]) => unknown>;
  const ex = proto.execute;
  proto.execute = function (this: unknown, s: unknown) { queries++; return ex.call(this, s); };
}

const pct = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.ceil(a.length * p) - 1)];
const results: { name: string; p50: number; p95: number; q: number }[] = [];

describe.skipIf(!on)("endpoint latency (p95 < 500 ms)", () => {
  let A = "";
  let bid = "";
  let gid = "";
  beforeAll(async () => {
    await cleanup();
    await mkUser("ZT-A1", "zt_admin", "admin");
    A = cookieOf(await call(login as never, "POST", "/api/v1/auth/login", { body: { username: "zt_admin", password: "TestPass#1" } }));
    const list = await call(garments as never, "GET", "/api/v1/garments?limit=5", { cookie: A });
    gid = list.data.garments[0].id;
    const today = todayIST();
    const b = await call(createBooking as never, "POST", "/api/v1/bookings", {
      cookie: A,
      body: { customer: { name: "Zt Perf", phone: "7999000066" }, eventName: "E", eventDate: addDays(today, 200), pickupDate: addDays(today, 198), returnDueDate: addDays(today, 200), garmentIds: [gid], advance: { amount: 100, mode: "CASH" } },
    });
    expect(b.status, JSON.stringify(b.data)).toBe(201);
    bid = b.data.booking.id;
  });
  afterAll(async () => {
    await cleanup();
    const out: string[] = ["endpoint".padEnd(34) + "p50 ms".padStart(8) + "p95 ms".padStart(8) + "  queries"];
    for (const r of results) out.push(r.name.padEnd(34) + r.p50.toFixed(0).padStart(8) + r.p95.toFixed(0).padStart(8) + String(r.q).padStart(8));
    process.stderr.write("\n" + out.join("\n") + "\n");
  });

  const cases: [string, () => Promise<{ status: number }>][] = [
    ["GET /garments", () => call(garments as never, "GET", "/api/v1/garments?limit=50", { cookie: A })],
    ["GET /garments?available…", () => call(garments as never, "GET", `/api/v1/garments?availableFrom=${addDays(todayIST(), 30)}&availableTo=${addDays(todayIST(), 32)}`, { cookie: A })],
    ["GET /garments/availability", () => call(availability as never, "GET", `/api/v1/garments/availability?from=${todayIST()}&to=${addDays(todayIST(), 30)}`, { cookie: A })],
    ["GET /customers?q=", () => call(customers as never, "GET", "/api/v1/customers?q=a", { cookie: A })],
    ["GET /bookings", () => call(bookings as never, "GET", "/api/v1/bookings?limit=50", { cookie: A })],
    ["GET /bookings?status=", () => call(bookings as never, "GET", "/api/v1/bookings?status=CONFIRMED&limit=50", { cookie: A })],
    ["GET /bookings/:id", () => call(booking as never, "GET", `/api/v1/bookings/${bid}`, { cookie: A, params: { id: bid } })],
    ["POST /bookings/quote", () => call(quote as never, "POST", "/api/v1/bookings/quote", { cookie: A, body: { garmentIds: [gid], pickupDate: addDays(todayIST(), 60), returnDueDate: addDays(todayIST(), 62), advance: 500 } })],
    ["GET /alerts", () => call(alerts as never, "GET", "/api/v1/alerts", { cookie: A })],
    ["GET /care", () => call(care as never, "GET", "/api/v1/care", { cookie: A })],
    ["GET /cash/today", () => call(cashToday as never, "GET", "/api/v1/cash/today", { cookie: A })],
    ["GET /reports/summary", () => call(report as never, "GET", "/api/v1/reports/summary", { cookie: A })],
  ];
  for (const [name, fn] of cases) {
    it(name, async () => {
      await fn(); // warm connection
      const ts: number[] = [];
      queries = 0;
      for (let i = 0; i < RUNS; i++) {
        const t = performance.now();
        const r = await fn();
        ts.push(performance.now() - t);
        expect(r.status).toBe(200);
      }
      const p95 = pct(ts, 0.95);
      results.push({ name, p50: pct(ts, 0.5), p95, q: Math.round(queries / RUNS) });
      expect(p95).toBeLessThan(BUDGET_MS);
    });
  }
});
