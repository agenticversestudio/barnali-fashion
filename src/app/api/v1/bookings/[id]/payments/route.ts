import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { addPayment } from "@/server/services/bookingLifecycle";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const out = await addPayment(user, id, body);
  return json({ booking: out }, { status: 201 });
});
