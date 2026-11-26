import { requireAdmin } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { cancelBooking } from "@/server/services/bookingLifecycle";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const out = await cancelBooking(user, id, body);
  return json({ booking: out }, { status: 200 });
});
