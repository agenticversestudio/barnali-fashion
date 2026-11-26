import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { USER_COLS, userDto } from "@/server/services/users";
import { oneOf, phone, str } from "@/server/validate";

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  const b = await readJson(req);
  const name = str(b, "name", { optional: true, max: 80 });
  const ph = phone(b, "phone", true);
  const role = oneOf(b, "role", ["admin", "staff"] as const, true);
  const active = typeof b.active === "boolean" ? b.active : undefined;
  if (b.active !== undefined && active === undefined) fail("VALIDATION", "active: must be true or false", { field: "active" });

  const row = await tx(async (t) => {
    const cur = (await t.execute({ sql: `SELECT ${USER_COLS} FROM users WHERE id=?`, args: [id] })).rows[0];
    if (!cur) fail("NOT_FOUND", "User not found");
    const removingAdmin = cur.role === "admin" && ((role && role !== "admin") || active === false);
    if (removingAdmin) {
      if (id === admin.id) fail("RULE", "You cannot demote or disable your own admin account");
      const n = Number((await t.execute("SELECT COUNT(*) n FROM users WHERE role='admin' AND active=1")).rows[0].n);
      if (n <= 1) fail("RULE", "At least one active admin is required");
    }
    await t.execute({
      sql: "UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), role=COALESCE(?,role), active=COALESCE(?,active) WHERE id=?",
      args: [name ?? null, ph ?? null, role ?? null, active === undefined ? null : active ? 1 : 0, id],
    });
    if (active === false) await t.execute({ sql: "DELETE FROM sessions WHERE user_id=?", args: [id] });
    const after = (await t.execute({ sql: `SELECT ${USER_COLS} FROM users WHERE id=?`, args: [id] })).rows[0];
    await audit(t, admin.id, "user.update", "user", id, { name: cur.name, role: cur.role, active: cur.active }, { name: after.name, role: after.role, active: after.active });
    return after;
  });
  return json({ user: userDto(row) });
});
