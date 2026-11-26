import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { json, route } from "@/server/http";

/** Remote logout: revoke every session of a user. */
export const DELETE = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  const n = await tx(async (t) => {
    const r = await t.execute({ sql: "DELETE FROM sessions WHERE user_id=?", args: [id] });
    await audit(t, admin.id, "user.revoke_sessions", "user", id);
    return r.rowsAffected;
  });
  return json({ revoked: n });
});
