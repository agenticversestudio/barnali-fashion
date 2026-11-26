import type { Role, SessionUser } from "@/types/api";
import { db } from "./db";
import { ApiError, fail } from "./http";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "bf_session";
const DAY = 86_400_000;
const SESSION_DAYS: Record<Role, number> = { staff: 30, admin: 7 };
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

const iso = (ms: number) => new Date(ms).toISOString();

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function readCookie(req: Request, name = SESSION_COOKIE): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function sessionCookie(token: string, role: Role): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS[role] * 86400}${secure}`;
}
export function clearCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

type UserRow = { id: string; name: string; username: string; role: Role; phone: string | null; active: number };
const toSessionUser = (r: UserRow): SessionUser => ({
  id: r.id,
  name: r.name,
  username: r.username,
  role: r.role,
  ...(r.phone ? { phone: r.phone } : {}),
});

async function createSession(userId: string, role: Role, userAgent: string | null): Promise<string> {
  const token = newToken();
  const now = Date.now();
  await db().execute({
    sql: "INSERT INTO sessions(token_hash,user_id,expires_at,last_seen,user_agent) VALUES (?,?,?,?,?)",
    args: [await sha256Hex(token), userId, iso(now + SESSION_DAYS[role] * DAY), iso(now), userAgent?.slice(0, 200) ?? null],
  });
  return token;
}

/** Verify credentials, enforce lockout, open a session. Returns the raw cookie token. */
export async function login(
  username: string,
  password: string,
  userAgent: string | null,
): Promise<{ user: SessionUser; token: string }> {
  const r = await db().execute({
    sql: "SELECT id,name,username,password_hash,role,phone,active,failed_count,locked_until FROM users WHERE username = ?",
    args: [username],
  });
  const row = r.rows[0];
  if (!row) {
    await verifyPassword(password, "pbkdf2$1000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="); // equalise timing
    return fail("UNAUTHENTICATED", "Wrong username or password");
  }
  const lockedUntil = row.locked_until ? Date.parse(String(row.locked_until)) : 0;
  if (lockedUntil > Date.now()) {
    const mins = Math.ceil((lockedUntil - Date.now()) / 60_000);
    return fail("LOCKED", `Too many wrong attempts. Try again in ${mins} minute(s).`);
  }
  const ok = await verifyPassword(password, String(row.password_hash));
  if (!ok) {
    const fails = Number(row.failed_count) + 1;
    if (fails >= MAX_FAILS) {
      await db().execute({ sql: "UPDATE users SET failed_count=0, locked_until=? WHERE id=?", args: [iso(Date.now() + LOCK_MS), row.id as string] });
    } else {
      await db().execute({ sql: "UPDATE users SET failed_count=? WHERE id=?", args: [fails, row.id as string] });
    }
    return fail("UNAUTHENTICATED", "Wrong username or password");
  }
  if (!Number(row.active)) return fail("FORBIDDEN", "This account is disabled. Ask the owner.");
  await db().execute({ sql: "UPDATE users SET failed_count=0, locked_until=NULL WHERE id=?", args: [row.id as string] });
  const user = toSessionUser(row as unknown as UserRow);
  return { user, token: await createSession(user.id, user.role, userAgent) };
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  await db().execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [await sha256Hex(token)] });
}

/** Look up the user for a raw cookie token; extends nothing, returns undefined if invalid/expired/disabled. */
export async function userFromToken(token: string | undefined): Promise<SessionUser | undefined> {
  if (!token) return undefined;
  const hash = await sha256Hex(token);
  const r = await db().execute({
    sql: `SELECT u.id,u.name,u.username,u.role,u.phone,u.active,s.expires_at,s.last_seen
          FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    args: [hash],
  });
  const row = r.rows[0];
  if (!row) return undefined;
  if (Date.parse(String(row.expires_at)) <= Date.now() || !Number(row.active)) {
    await db().execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hash] });
    return undefined;
  }
  // refresh last_seen at most once per 10 minutes (keeps writes low)
  if (Date.now() - Date.parse(String(row.last_seen)) > 600_000) {
    await db().execute({ sql: "UPDATE sessions SET last_seen=? WHERE token_hash=?", args: [iso(Date.now()), hash] });
  }
  return toSessionUser(row as unknown as UserRow);
}

/** CSRF: browsers always send Origin on cross-site POSTs. If present it must match our host. */
export function assertSameOrigin(req: Request): void {
  const m = req.method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser client (curl, tests, cron): no ambient cookie risk
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let ok = false;
  try {
    ok = new URL(origin).host === host;
    const allowed = process.env.APP_ORIGIN;
    if (!ok && allowed) ok = new URL(origin).origin === new URL(allowed).origin;
  } catch {
    ok = false;
  }
  if (!ok) throw new ApiError("FORBIDDEN", "Cross-site request blocked");
}

/** Gate for API routes. Throws 401/403. Also applies the CSRF origin check on mutations. */
export async function requireUser(req: Request, roles: readonly Role[] = ["admin", "staff"]): Promise<SessionUser> {
  assertSameOrigin(req);
  const user = await userFromToken(readCookie(req));
  if (!user) return fail("UNAUTHENTICATED", "Please log in");
  if (!roles.includes(user.role)) return fail("FORBIDDEN", "You do not have access to this");
  return user;
}
export const requireAdmin = (req: Request) => requireUser(req, ["admin"]);

export { hashPassword };

export function validatePasswordStrength(pw: string): void {
  if (pw.length < 8) fail("VALIDATION", "password: at least 8 characters", { field: "password" });
  if (pw.length > 200) fail("VALIDATION", "password: too long", { field: "password" });
}
