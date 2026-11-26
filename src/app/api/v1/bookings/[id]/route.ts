import { requireUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { getBookingDto } from "@/server/services/bookings";

export const GET = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser(req);
  const { id } = await ctx.params;
  return json({ booking: await getBookingDto(id) });
});
