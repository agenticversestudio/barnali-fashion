import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { pickupBooking } from "@/server/services/bookingLifecycle";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const out = await pickupBooking(user, id, body);
  return json({ booking: out }, { status: 200 });
});
