import { requireAdmin } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { deleteExpense, updateExpense } from "@/server/services/expenses";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  return json({ expense: await updateExpense(admin, id, await readJson(req)) });
});

export const DELETE = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  await deleteExpense(admin, id);
  return json({ ok: true });
});
