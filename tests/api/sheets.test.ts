import { generateKeyPairSync, createVerify } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { syncSheets } from "@/server/sheets";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as cron } from "@/app/api/v1/cron/sheets/route";
import { POST as manual } from "@/app/api/v1/sync/sheets/route";
import { GET as status } from "@/app/api/v1/sync/status/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const SECRET = "cron-secret-0123456789abcdef";
const saved = { ...process.env };

type Rec = { url: string; method: string; headers: Record<string, string>; body?: string };
let calls: Rec[] = [];
let failValues = false;
let existing = ["Bookings"]; // tabs already in the sheet

const fakeFetch = (async (url: string | URL, init: RequestInit = {}) => {
  const u = String(url);
  const headers = Object.fromEntries(new Headers(init.headers as HeadersInit).entries());
  calls.push({ url: u, method: init.method ?? "GET", headers, body: init.body ? String(init.body) : undefined });
  const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
  if (u.startsWith("https://oauth2.googleapis.com/token")) return ok({ access_token: "tok-123", expires_in: 3600 });
  if (failValues && u.includes("/values/")) return new Response("forbidden", { status: 403 });
  if (u.includes("fields=sheets.properties.title")) return ok({ sheets: existing.map((t) => ({ properties: { title: t } })) });
  return ok({});
}) as typeof fetch;

let A = "";
let S = "";
beforeAll(async () => {
  Object.assign(process.env, { GOOGLE_SA_EMAIL: "sync@proj.iam.gserviceaccount.com", GOOGLE_SA_PRIVATE_KEY: privateKey.replace(/\n/g, "\\n"), GOOGLE_SHEET_ID: "sheet123", CRON_SECRET: SECRET });
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  const lg = (u: string) => call(login as never, "POST", "/api/v1/auth/login", { body: { username: u, password: "TestPass#1" } });
  S = cookieOf(await lg("zt_staff"));
  A = cookieOf(await lg("zt_admin"));
  await db().execute("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('ZT-SG1','=HYPERLINK(\"x\")','Lehenga','M','R',1000,500)");
});
beforeEach(async () => {
  calls = []; failValues = false; existing = ["Bookings"];
  await db().execute("DELETE FROM sync_log WHERE trigger='MANUAL' OR trigger='CRON'");
});
afterAll(async () => {
  await db().execute("DELETE FROM sync_log");
  await cleanup();
  process.env = saved;
});

describe("syncSheets", () => {
  it("signs a valid RS256 JWT, creates missing tabs, clears + writes every tab with RAW values", async () => {
    const r = await syncSheets({ trigger: "MANUAL", fetchImpl: fakeFetch });
    expect(r.ok).toBe(true);
    expect(r.tabs).toBe(7);

    const tokenCall = calls.find((c) => c.url.startsWith("https://oauth2.googleapis.com/token"))!;
    const form = new URLSearchParams(tokenCall.body!);
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    const [h, c, s] = form.get("assertion")!.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claims).toMatchObject({ iss: "sync@proj.iam.gserviceaccount.com", aud: "https://oauth2.googleapis.com/token", scope: "https://www.googleapis.com/auth/spreadsheets" });
    expect(claims.exp - claims.iat).toBe(3600);
    expect(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);

    const add = calls.find((x) => x.url.endsWith(":batchUpdate"))!;
    const added = (JSON.parse(add.body!).requests as { addSheet: { properties: { title: string } } }[]).map((q) => q.addSheet.properties.title).sort();
    expect(added).toEqual(["CashClosings", "Customers", "Expenses", "Garments", "Payments", "_SyncLog"]); // Bookings already existed

    const writes = calls.filter((x) => x.method === "PUT");
    expect(writes.length).toBe(7);
    expect(writes.every((w) => w.url.includes("valueInputOption=RAW") && w.headers.authorization === "Bearer tok-123")).toBe(true);
    expect(calls.filter((x) => x.url.includes(":clear")).length).toBe(7);

    const garments = JSON.parse(writes.find((w) => decodeURIComponent(w.url).includes("'Garments'"))!.body!);
    expect(garments.values[0]).toContain("purchase_cost");
    expect(garments.values.some((row: unknown[]) => row[0] === "ZT-SG1" && row[1] === '=HYPERLINK("x")')).toBe(true); // raw text, written as-is
    const log = JSON.parse(writes.find((w) => decodeURIComponent(w.url).includes("'_SyncLog'"))!.body!);
    expect(log.values[0]).toEqual(["id", "trigger", "started_at", "finished_at", "status", "tabs", "rows", "message"]);
  });

  it("records OK in sync_log and exposes it via status", async () => {
    await syncSheets({ trigger: "MANUAL", fetchImpl: fakeFetch });
    const row = (await db().execute("SELECT status,tabs,finished_at FROM sync_log ORDER BY id DESC LIMIT 1")).rows[0];
    expect(row.status).toBe("OK");
    expect(Number(row.tabs)).toBe(7);
    const st = await call(status as never, "GET", "/api/v1/sync/status", { cookie: A });
    expect(st.status).toBe(200);
    expect(st.data).toMatchObject({ configured: true, lastStatus: "OK" });
    expect(st.data.lastSyncAt).toBeTruthy();
  });

  it("Google failure → FAILED logged without leaking the key, error surfaced as 500", async () => {
    failValues = true;
    await expect(syncSheets({ trigger: "CRON", fetchImpl: fakeFetch })).rejects.toMatchObject({ code: "INTERNAL" });
    const row = (await db().execute("SELECT status,message FROM sync_log ORDER BY id DESC LIMIT 1")).rows[0];
    expect(row.status).toBe("FAILED");
    expect(String(row.message)).toContain("403");
    expect(String(row.message)).not.toContain("PRIVATE KEY");
    const st = await call(status as never, "GET", "/api/v1/sync/status", { cookie: A });
    expect(st.data.lastStatus).toBe("FAILED");
  });

  it("refuses a second concurrent run, but ignores a stale RUNNING row", async () => {
    await db().execute("INSERT INTO sync_log(trigger) VALUES ('MANUAL')");
    await expect(syncSheets({ trigger: "MANUAL", fetchImpl: fakeFetch })).rejects.toMatchObject({ code: "RULE" });
    await db().execute("UPDATE sync_log SET started_at='2020-01-01T00:00:00.000Z'");
    expect((await syncSheets({ trigger: "MANUAL", fetchImpl: fakeFetch })).ok).toBe(true);
  });

  it("not configured → 422 RULE, nothing logged", async () => {
    const id = process.env.GOOGLE_SHEET_ID;
    delete process.env.GOOGLE_SHEET_ID;
    await expect(syncSheets({ trigger: "MANUAL", fetchImpl: fakeFetch })).rejects.toMatchObject({ code: "RULE" });
    process.env.GOOGLE_SHEET_ID = id;
    expect(Number((await db().execute("SELECT COUNT(*) c FROM sync_log")).rows[0].c)).toBe(0);
  });
});

describe("endpoints", () => {
  it("cron: wrong / missing / short secret → 401; right secret → not 401", async () => {
    expect((await call(cron as never, "GET", "/api/v1/cron/sheets", {})).status).toBe(401);
    expect((await call(cron as never, "GET", "/api/v1/cron/sheets", { headers: { authorization: "Bearer nope" } })).status).toBe(401);
    expect((await call(cron as never, "GET", "/api/v1/cron/sheets", { headers: { authorization: `Bearer ${SECRET}x` } })).status).toBe(401);
    const saveSecret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect((await call(cron as never, "GET", "/api/v1/cron/sheets", { headers: { authorization: "Bearer " } })).status).toBe(401);
    process.env.CRON_SECRET = saveSecret;
  });
  it("manual sync + status: staff 403, no session 401", async () => {
    expect((await call(manual as never, "POST", "/api/v1/sync/sheets", { cookie: S, body: {} })).status).toBe(403);
    expect((await call(manual as never, "POST", "/api/v1/sync/sheets", { body: {} })).status).toBe(401);
    expect((await call(status as never, "GET", "/api/v1/sync/status", { cookie: S })).status).toBe(403);
    expect((await call(status as never, "GET", "/api/v1/sync/status", {})).status).toBe(401);
  });
});
