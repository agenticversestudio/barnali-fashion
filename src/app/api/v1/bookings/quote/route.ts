import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { quoteBooking } from "@/server/services/bookingOps";

/** Live totals + conflict list for the booking wizard. Pure preview: writes nothing. */
export const POST = route(async (req: Request) => {
  await requireUser(req);
  return json(await quoteBooking(await readJson(req)));
});
