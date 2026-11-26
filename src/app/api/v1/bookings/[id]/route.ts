import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { getBookingDto } from "@/server/services/bookings";
import { updateBooking } from "@/server/services/bookingLifecycle";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  return json({ booking: await getBookingDto(id) });
});

/** Non-money fields: staff or admin. Money fields (charges): admin only, audited. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  return json({ booking: await updateBooking(user, id, await readJson(req)) });
});
