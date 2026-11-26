import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { deletePhoto } from "@/server/services/photos";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  await deletePhoto(admin, id);
  return json({ ok: true });
});
