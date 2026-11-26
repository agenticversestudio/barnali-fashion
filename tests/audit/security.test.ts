// Deep-audit security suite: brute-force bounds, lockout expiry, CSRF on every mutating verb, cookie flags, session storage, cron auth.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { sessionCookie, clearCookie } from "@/server/auth";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { GET as me } from "@/app/api/v1/auth/me/route";
import { POST as createUser } from "@/app/api/v1/users/route";
import { PATCH as patchBooking } from "@/app/api/v1/bookings/[id]/route";
import { DELETE as delPhoto } from "@/app/api/v1/photos/[id]/route";
import { GET as cron } from "@/app/api/v1/cron/sheets/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const H = (m: string, h: unknown, path: string, o: Parameters<typeof call>[3] = {}) => call(h as never, m, path, o);
const attempt = (u: string, p: string) => H("POST", login, "/api/v1/auth/login", { body: { username: u, password: p } });
const row = async (u: string) => (await db().execute({ sql: "SELECT failed_count, locked_until FROM users WHERE username=?", args: [u] })).rows[0];

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await mkUser("ZT-S2", "zt_brute", "staff");
  await mkUser("ZT-S3", "zt_expiry", "staff");
});
afterAll(cleanup);

describe("brute force", () => {
  it("a burst of 30 PARALLEL guesses on one account is capped at 5 real attempts (the rest are locked out, not verified)", async () => {
    const rs = await Promise.all(Array.from({ length: 30 }, (_, i) => attempt("zt_brute", i === 29 ? "TestPass#1" : `guess-${i}`)));
    const verified = rs.filter((r) => r.status === 401 || r.status === 200).length;
    const locked = rs.filter((r) => r.status === 423).length;
    expect(verified).toBeLessThanOrEqual(5);
    expect(verified + locked).toBe(30);
    // and the correct password no longer works while locked
    expect((await attempt("zt_brute", "TestPass#1")).status).toBe(423);
  });

  it("5 sequential wrong passwords lock; the 5th wrong is still a plain 401, the 6th is 423 even with the right password", async () => {
    for (let i = 0; i < 5; i++) expect((await attempt("zt_staff", "bad")).status).toBe(401);
    expect((await attempt("zt_staff", "TestPass#1")).status).toBe(423);
  });

  it("lock expires after 15 minutes; one wrong guess afterwards does NOT immediately re-lock; success clears the counter", async () => {
    for (let i = 0; i < 5; i++) await attempt("zt_expiry", "bad");
    expect((await attempt("zt_expiry", "TestPass#1")).status).toBe(423);
    const locked = Date.parse(String((await row("zt_expiry")).locked_until));
    expect(locked - Date.now()).toBeGreaterThan(14 * 60_000);
    expect(locked - Date.now()).toBeLessThanOrEqual(15 * 60_000 + 2000);
    await db().execute({ sql: "UPDATE users SET locked_until=? WHERE username='zt_expiry'", args: [new Date(Date.now() - 1000).toISOString()] });
    expect((await attempt("zt_expiry", "oops")).status).toBe(401); // 1 wrong after expiry: counted as 1, not as 6
    expect(Number((await row("zt_expiry")).failed_count)).toBe(1);
    expect((await attempt("zt_expiry", "TestPass#1")).status).toBe(200);
    expect(Number((await row("zt_expiry")).failed_count)).toBe(0);
    expect((await row("zt_expiry")).locked_until).toBeNull();
  });

  it("wrong password and unknown user are indistinguishable in status and message", async () => {
    const a = await attempt("zt_admin", "nope");
    const b = await attempt("zt_nobody_here", "nope");
    expect(a.status).toBe(b.status);
    expect(JSON.stringify(a.data)).toBe(JSON.stringify(b.data));
  });
});

describe("sessions and cookies", () => {
  it("raw session token is never stored: only its SHA-256 hash is in the database", async () => {
    const r = await attempt("zt_admin", "TestPass#1");
    const token = cookieOf(r).split("=")[1];
    expect(token.length).toBeGreaterThan(30);
    const all = (await db().execute("SELECT token_hash FROM sessions")).rows.map((x) => String(x.token_hash));
    expect(all).not.toContain(token);
    expect(all.every((h) => /^[0-9a-f]{64}$/.test(h))).toBe(true);
  });

  it("cookie flags: HttpOnly + SameSite=Lax always; Secure in production", () => {
    for (const c of [sessionCookie("t", "admin"), sessionCookie("t", "staff"), clearCookie()]) {
      expect(c).toMatch(/HttpOnly/);
      expect(c).toMatch(/SameSite=Lax/);
      expect(c).toMatch(/Path=\//);
    }
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(sessionCookie("t", "admin")).toMatch(/; Secure/);
      expect(sessionCookie("t", "staff")).toMatch(/; Secure/);
      expect(clearCookie()).toMatch(/; Secure/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("session lifetimes: admin 7 days, staff 30 days", () => {
    expect(sessionCookie("t", "admin")).toMatch(/Max-Age=604800\b/);
    expect(sessionCookie("t", "staff")).toMatch(/Max-Age=2592000\b/);
  });

  it("logout deletes the server-side session: the old cookie is dead", async () => {
    const c = cookieOf(await attempt("zt_admin", "TestPass#1"));
    expect((await H("GET", me, "/api/v1/auth/me", { cookie: c })).status).toBe(200);
    await H("POST", logout, "/api/v1/auth/logout", { cookie: c });
    expect((await H("GET", me, "/api/v1/auth/me", { cookie: c })).status).toBe(401);
  });

  it("login response never contains the hash or token in the body", async () => {
    const r = await attempt("zt_admin", "TestPass#1");
    expect(JSON.stringify(r.data)).not.toMatch(/pbkdf2|password_hash|passwordHash|token/i);
  });
});

describe("CSRF: every mutating verb rejects a foreign Origin, even with a valid admin cookie", () => {
  let C = "";
  beforeAll(async () => {
    C = cookieOf(await attempt("zt_admin", "TestPass#1"));
  });
  const evil = { origin: "https://evil.example", host: "localhost" };
  it("POST", async () => expect((await H("POST", createUser, "/api/v1/users", { cookie: C, headers: evil, body: { name: "X", username: "zt_evil", password: "TestPass#1", role: "staff" } })).status).toBe(403));
  it("PATCH", async () => expect((await H("PATCH", patchBooking, "/api/v1/bookings/ZT-X", { cookie: C, headers: evil, params: { id: "ZT-X" }, body: { notes: "x" } })).status).toBe(403));
  it("DELETE", async () => expect((await H("DELETE", delPhoto, "/api/v1/photos/1", { cookie: C, headers: evil, params: { id: "1" } })).status).toBe(403));
  it("Origin: null (sandboxed iframe / privacy redirect) is rejected", async () =>
    expect((await H("POST", createUser, "/api/v1/users", { cookie: C, headers: { origin: "null", host: "localhost" }, body: { name: "X", username: "zt_evil2", password: "TestPass#1", role: "staff" } })).status).toBe(403));
  it("look-alike host (localhost.evil.example) is rejected", async () =>
    expect((await H("POST", createUser, "/api/v1/users", { cookie: C, headers: { origin: "https://localhost.evil.example", host: "localhost" }, body: { name: "X", username: "zt_evil3", password: "TestPass#1", role: "staff" } })).status).toBe(403));
  it("same-origin request still works", async () => {
    const r = await H("POST", createUser, "/api/v1/users", { cookie: C, headers: { origin: "http://localhost", host: "localhost" }, body: { name: "Zt Okay", username: "zt_okay", password: "TestPass#1", role: "staff" } });
    expect(r.status).toBe(201);
  });
  it("APP_ORIGIN allows exactly that origin and nothing else", async () => {
    vi.stubEnv("APP_ORIGIN", "https://erp.example.in");
    try {
      const ok = await H("POST", createUser, "/api/v1/users", { cookie: C, headers: { origin: "https://erp.example.in", host: "internal-host" }, body: { name: "Zt Okay2", username: "zt_okay2", password: "TestPass#1", role: "staff" } });
      expect(ok.status).toBe(201);
      const bad = await H("POST", createUser, "/api/v1/users", { cookie: C, headers: { origin: "https://erp.example.in.evil.com", host: "internal-host" }, body: { name: "X", username: "zt_evil4", password: "TestPass#1", role: "staff" } });
      expect(bad.status).toBe(403);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("none of the rejected attempts created a user", async () => {
    const n = Number((await db().execute("SELECT COUNT(*) n FROM users WHERE username LIKE 'zt!_evil%' ESCAPE '!'")).rows[0].n);
    expect(n).toBe(0);
  });
});

describe("cron endpoint", () => {
  const hit = (auth?: string) => call(cron as never, "GET", "/api/v1/cron/sheets", { headers: auth ? { authorization: auth } : {} });
  it("no secret / wrong secret / unset env / too-short secret are all refused (never 'Bearer undefined')", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await hit("Bearer ")).status).toBe(401);
    expect((await hit()).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "short");
    expect((await hit("Bearer short")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "a-long-enough-secret-123");
    expect((await hit()).status).toBe(401);
    expect((await hit("Bearer a-long-enough-secret-124")).status).toBe(401);
    expect((await hit("Bearer undefined")).status).toBe(401);
    vi.unstubAllEnvs();
  });
});

describe("production safety scripts", () => {
  it("set-dev-passwords.ts hard-fails (exit 2) without --i-am-on-a-dev-database, before any database connection is opened", async () => {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.execPath, ["scripts/set-dev-passwords.ts"], { encoding: "utf8", env: { ...process.env, TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "" } });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Refusing to run/);
    expect(r.stderr).toMatch(/--i-am-on-a-dev-database/);
  });
});
