import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET, PATCH } from "@/app/api/v1/settings/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

let A = "";
let S = "";
let saved: Record<string, string> = {};
const get = (cookie?: string) => call(GET as never, "GET", "/api/v1/settings", { cookie });
const patch = (cookie: string | undefined, body: unknown) => call(PATCH as never, "PATCH", "/api/v1/settings", { cookie, body });

beforeAll(async () => {
  await cleanup();
  saved = Object.fromEntries((await db().execute("SELECT key,value FROM settings")).rows.map((r) => [String(r.key), String(r.value)]));
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  const lg = (u: string) => call(login as never, "POST", "/api/v1/auth/login", { body: { username: u, password: "TestPass#1" } });
  S = cookieOf(await lg("zt_staff"));
  A = cookieOf(await lg("zt_admin"));
});
afterAll(async () => {
  // other suites depend on the 15 % late fee: always put the original values back
  for (const [k, v] of Object.entries(saved)) await db().execute({ sql: "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", args: [k, v] });
  await cleanup();
});

describe("/settings", () => {
  it("staff and admin can read; no session 401", async () => {
    expect((await get()).status).toBe(401);
    const s = await get(S);
    expect(s.status).toBe(200);
    expect(s.data.settings).toMatchObject({ lateFeePercent: 15, bufferDays: 1 });
    expect(typeof s.data.settings.shopName).toBe("string");
    expect((await get(A)).data.settings).toEqual(s.data.settings);
  });

  it("staff cannot change anything (403)", async () => {
    expect((await patch(S, { lateFeePercent: 1 })).status).toBe(403);
    expect((await get(S)).data.settings.lateFeePercent).toBe(15);
  });

  it("admin changes late fee + shop details; audited with before/after; persists", async () => {
    const r = await patch(A, { lateFeePercent: 20, shopName: "Zt Boutique", shopPhone: "9876543210" });
    expect(r.status).toBe(200);
    expect(r.data.settings).toMatchObject({ lateFeePercent: 20, shopName: "Zt Boutique", shopPhone: "9876543210" });
    expect((await get(S)).data.settings.lateFeePercent).toBe(20);
    const log = (await db().execute("SELECT before, after FROM audit_log WHERE action='settings.edit' AND user_id='ZT-A1' ORDER BY id DESC LIMIT 1")).rows[0];
    expect(JSON.parse(String(log.before)).late_fee_percent).toBe("15");
    expect(JSON.parse(String(log.after)).late_fee_percent).toBe("20");
  });

  it("an unchanged value writes no audit row", async () => {
    const n = async () => Number((await db().execute("SELECT COUNT(*) c FROM audit_log WHERE action='settings.edit' AND user_id='ZT-A1'")).rows[0].c);
    const before = await n();
    expect((await patch(A, { lateFeePercent: 20 })).status).toBe(200);
    expect(await n()).toBe(before);
  });

  it("validates: percent 0..100 integer, read-only/unknown fields, empty shop name, empty body", async () => {
    expect((await patch(A, { lateFeePercent: 101 })).status).toBe(400);
    expect((await patch(A, { lateFeePercent: -1 })).status).toBe(400);
    expect((await patch(A, { lateFeePercent: 12.5 })).status).toBe(400);
    expect((await patch(A, { lateFeePercent: "abc" })).status).toBe(400);
    expect((await patch(A, { bufferDays: 3 })).status).toBe(400); // fixed by the database trigger
    expect((await patch(A, { shopName: "  " })).status).toBe(400);
    expect((await patch(A, {})).status).toBe(400);
    expect((await get(A)).data.settings.bufferDays).toBe(1);
  });

  it("0 % is allowed (no late fee)", async () => {
    expect((await patch(A, { lateFeePercent: 0 })).data.settings.lateFeePercent).toBe(0);
  });
});
