import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { GET as me } from "@/app/api/v1/auth/me/route";
import { GET as listUsers, POST as createUser } from "@/app/api/v1/users/route";
import { PATCH as patchUser } from "@/app/api/v1/users/[id]/route";
import { POST as resetPw } from "@/app/api/v1/users/[id]/reset-password/route";
import { DELETE as revoke } from "@/app/api/v1/users/[id]/sessions/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

const PW = "TestPass#1";
let adminCookie = "";
let staffCookie = "";

async function loginAs(username: string, password = PW) {
  return call(login as never, "POST", "/api/v1/auth/login", { body: { username, password } });
}

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await mkUser("ZT-S2", "zt_locked", "staff");
  await mkUser("ZT-S3", "zt_disabled", "staff");
  await db().execute("UPDATE users SET active=0 WHERE id='ZT-S3'");
  adminCookie = cookieOf(await loginAs("zt_admin"));
  staffCookie = cookieOf(await loginAs("zt_staff"));
});
afterAll(cleanup);

describe("login / me / logout", () => {
  it("good login sets an HttpOnly SameSite=Lax cookie and returns the user (no hash)", async () => {
    const r = await loginAs("zt_staff");
    expect(r.status).toBe(200);
    expect(r.data.user).toMatchObject({ id: "ZT-S1", role: "staff", username: "zt_staff" });
    expect(JSON.stringify(r.data)).not.toMatch(/hash|password/i);
    const sc = r.headers.get("set-cookie") ?? "";
    expect(sc).toMatch(/^bf_session=/);
    expect(sc).toMatch(/HttpOnly/);
    expect(sc).toMatch(/SameSite=Lax/);
    expect(sc).toMatch(/Max-Age=2592000/); // staff 30 days
  });
  it("admin session lasts 7 days", async () => {
    const r = await loginAs("zt_admin");
    expect(r.headers.get("set-cookie")).toMatch(/Max-Age=604800/);
  });
  it("username is case-insensitive", async () => {
    expect((await loginAs("ZT_Staff")).status).toBe(200);
  });
  it("wrong password → 401, unknown user → 401 (same message)", async () => {
    const a = await loginAs("zt_staff", "nope-nope");
    const b = await loginAs("zt_nobody", "nope-nope");
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.data.error.message).toBe(b.data.error.message);
  });
  it("disabled user → 403", async () => {
    expect((await loginAs("zt_disabled")).status).toBe(403);
  });
  it("missing fields → 400 VALIDATION", async () => {
    const r = await call(login as never, "POST", "/api/v1/auth/login", { body: { username: "x" } });
    expect(r.status).toBe(400);
    expect(r.data.error.code).toBe("VALIDATION");
  });
  it("lockout after 5 wrong passwords, even the right password is refused", async () => {
    for (let i = 0; i < 5; i++) expect((await loginAs("zt_locked", "wrong-wrong")).status).toBe(401);
    const r = await loginAs("zt_locked");
    expect(r.status).toBe(423);
    expect(r.data.error.code).toBe("LOCKED");
  });
  it("me: 401 without cookie, user with cookie", async () => {
    expect((await call(me as never, "GET", "/api/v1/auth/me")).status).toBe(401);
    const r = await call(me as never, "GET", "/api/v1/auth/me", { cookie: staffCookie });
    expect(r.status).toBe(200);
    expect(r.data.user.id).toBe("ZT-S1");
  });
  it("garbage cookie → 401", async () => {
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: "bf_session=garbage" })).status).toBe(401);
  });
  it("logout kills the session", async () => {
    const c = cookieOf(await loginAs("zt_staff"));
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(200);
    const out = await call(logout as never, "POST", "/api/v1/auth/logout", { cookie: c });
    expect(out.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(401);
  });
  it("expired session → 401", async () => {
    const c = cookieOf(await loginAs("zt_staff"));
    await db().execute("UPDATE sessions SET expires_at='2000-01-01T00:00:00.000Z' WHERE user_id='ZT-S1'");
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(401);
    staffCookie = cookieOf(await loginAs("zt_staff"));
  });
});

describe("CSRF origin check", () => {
  it("cross-site Origin on a mutation → 403; same-host Origin ok", async () => {
    const evil = await call(createUser as never, "POST", "/api/v1/users", {
      cookie: adminCookie,
      headers: { origin: "https://evil.example", host: "localhost" },
      body: { name: "X", username: "zt_evil", password: "TestPass#1", role: "staff" },
    });
    expect(evil.status).toBe(403);
    const okR = await call(me as never, "GET", "/api/v1/auth/me", { cookie: adminCookie, headers: { origin: "https://evil.example" } });
    expect(okR.status).toBe(200); // GET is not origin-checked
  });
});

describe("users API (admin only)", () => {
  it("staff gets 403 on every users endpoint", async () => {
    const p = { cookie: staffCookie, params: { id: "ZT-S1" } };
    expect((await call(listUsers as never, "GET", "/api/v1/users", p)).status).toBe(403);
    expect((await call(createUser as never, "POST", "/api/v1/users", { ...p, body: {} })).status).toBe(403);
    expect((await call(patchUser as never, "PATCH", "/api/v1/users/ZT-S1", { ...p, body: { role: "admin" } })).status).toBe(403);
    expect((await call(resetPw as never, "POST", "/api/v1/users/ZT-S1/reset-password", { ...p, body: { password: "NewPass#123" } })).status).toBe(403);
    expect((await call(revoke as never, "DELETE", "/api/v1/users/ZT-S1/sessions", p)).status).toBe(403);
  });
  it("no cookie → 401", async () => {
    expect((await call(listUsers as never, "GET", "/api/v1/users")).status).toBe(401);
  });
  it("admin lists users without password hashes", async () => {
    const r = await call(listUsers as never, "GET", "/api/v1/users", { cookie: adminCookie });
    expect(r.status).toBe(200);
    expect(r.data.users.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(r.data)).not.toMatch(/pbkdf2|password_hash|passwordHash/);
  });
  it("admin creates a staff user who can log in; duplicate username → 422; weak password → 400", async () => {
    const r = await call(createUser as never, "POST", "/api/v1/users", {
      cookie: adminCookie,
      body: { name: "New Staff", username: "ZT_New1", password: "StaffPass#9", role: "staff", phone: "+91 98610 23451" },
    });
    expect(r.status).toBe(201);
    expect(r.data.user).toMatchObject({ username: "zt_new1", role: "staff", phone: "9861023451", active: true });
    expect((await loginAs("zt_new1", "StaffPass#9")).status).toBe(200);
    const dup = await call(createUser as never, "POST", "/api/v1/users", {
      cookie: adminCookie,
      body: { name: "Again", username: "zt_new1", password: "StaffPass#9", role: "staff" },
    });
    expect(dup.status).toBe(422);
    const weak = await call(createUser as never, "POST", "/api/v1/users", {
      cookie: adminCookie,
      body: { name: "W", username: "zt_weak", password: "short", role: "staff" },
    });
    expect(weak.status).toBe(400);
    const a = await db().execute("SELECT COUNT(*) n FROM audit_log WHERE action='user.create' AND user_id='ZT-A1'");
    expect(Number(a.rows[0].n)).toBeGreaterThanOrEqual(1);
  });
  it("reset password: old fails, new works, old sessions die, lock cleared", async () => {
    const c = cookieOf(await loginAs("zt_new1", "StaffPass#9"));
    const id = (await db().execute("SELECT id FROM users WHERE username='zt_new1'")).rows[0].id as string;
    const r = await call(resetPw as never, "POST", `/api/v1/users/${id}/reset-password`, {
      cookie: adminCookie, params: { id }, body: { password: "Changed#Pass1" },
    });
    expect(r.status).toBe(200);
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(401);
    expect((await loginAs("zt_new1", "StaffPass#9")).status).toBe(401);
    expect((await loginAs("zt_new1", "Changed#Pass1")).status).toBe(200);
  });
  it("remote logout revokes sessions", async () => {
    const c = cookieOf(await loginAs("zt_staff"));
    const r = await call(revoke as never, "DELETE", "/api/v1/users/ZT-S1/sessions", { cookie: adminCookie, params: { id: "ZT-S1" } });
    expect(r.status).toBe(200);
    expect(r.data.revoked).toBeGreaterThanOrEqual(1);
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(401);
    staffCookie = cookieOf(await loginAs("zt_staff"));
  });
  it("disabling a user kills their sessions and blocks login", async () => {
    const c = cookieOf(await loginAs("zt_staff"));
    const r = await call(patchUser as never, "PATCH", "/api/v1/users/ZT-S1", { cookie: adminCookie, params: { id: "ZT-S1" }, body: { active: false } });
    expect(r.status).toBe(200);
    expect((await call(me as never, "GET", "/api/v1/auth/me", { cookie: c })).status).toBe(401);
    expect((await loginAs("zt_staff")).status).toBe(403);
    await call(patchUser as never, "PATCH", "/api/v1/users/ZT-S1", { cookie: adminCookie, params: { id: "ZT-S1" }, body: { active: true } });
    staffCookie = cookieOf(await loginAs("zt_staff"));
  });
  it("admin cannot disable or demote themselves", async () => {
    const r = await call(patchUser as never, "PATCH", "/api/v1/users/ZT-A1", { cookie: adminCookie, params: { id: "ZT-A1" }, body: { active: false } });
    expect(r.status).toBe(422);
    const r2 = await call(patchUser as never, "PATCH", "/api/v1/users/ZT-A1", { cookie: adminCookie, params: { id: "ZT-A1" }, body: { role: "staff" } });
    expect(r2.status).toBe(422);
  });
  it("unknown user → 404", async () => {
    const r = await call(patchUser as never, "PATCH", "/api/v1/users/NOPE", { cookie: adminCookie, params: { id: "NOPE" }, body: { name: "Z" } });
    expect(r.status).toBe(404);
  });
});
