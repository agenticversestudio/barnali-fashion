import { hashPassword, requireAdmin, validatePasswordStrength } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { req as reqStr } from "@/server/validate";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  const password = reqStr(await readJson(req), "password", { max: 200 });
  validatePasswordStrength(password);
  const hash = await hashPassword(password);
  await tx(async (t) => {
    const r = await t.execute({ sql: "UPDATE users SET password_hash=?, failed_count=0, locked_until=NULL WHERE id=?", args: [hash, id] });
    if (!r.rowsAffected) fail("NOT_FOUND", "User not found");
    await t.execute({ sql: "DELETE FROM sessions WHERE user_id=?", args: [id] });
    await audit(t, admin.id, "user.reset_password", "user", id);
  });
  return json({ ok: true });
});
