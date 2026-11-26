import { hashPassword, requireAdmin, validatePasswordStrength } from "@/server/auth";
import { audit } from "@/server/audit";
import { db, tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { nextCounter, pad } from "@/server/ids";
import { USER_COLS, userDto } from "@/server/services/users";
import { phone, req as reqStr, reqOneOf } from "@/server/validate";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  const r = await db().execute(`SELECT ${USER_COLS} FROM users ORDER BY created_at`);
  return json({ users: r.rows.map(userDto) });
});

export const POST = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  const b = await readJson(req);
  const name = reqStr(b, "name", { max: 80 });
  const username = reqStr(b, "username", { min: 3, max: 30 }).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(username)) fail("VALIDATION", "username: letters, numbers, . _ - only", { field: "username" });
  const password = reqStr(b, "password", { max: 200 });
  validatePasswordStrength(password);
  const role = reqOneOf(b, "role", ["admin", "staff"] as const);
  const ph = phone(b, "phone", true) ?? null;
  const hash = await hashPassword(password);

  const row = await tx(async (t) => {
    const dup = await t.execute({ sql: "SELECT 1 FROM users WHERE username = ?", args: [username] });
    if (dup.rows.length) fail("RULE", "That username is already taken", { field: "username" });
    const id = `USR-${pad(await nextCounter(t, "user"), 4)}`;
    await t.execute({
      sql: "INSERT INTO users(id,name,username,password_hash,role,phone) VALUES (?,?,?,?,?,?)",
      args: [id, name, username, hash, role, ph],
    });
    await audit(t, admin.id, "user.create", "user", id, undefined, { username, role });
    return (await t.execute({ sql: `SELECT ${USER_COLS} FROM users WHERE id=?`, args: [id] })).rows[0];
  });
  return json({ user: userDto(row) }, { status: 201 });
});
