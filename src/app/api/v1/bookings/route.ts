import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { params, qDate, qEnum, qLimit, qStr } from "@/server/query";
import { listBookings } from "@/server/services/bookings";
import { createBooking } from "@/server/services/bookingOps";
import type { BookingStatus } from "@/types/api";

const STATUSES = ["CONFIRMED", "OUT_ON_RENT", "COMPLETED", "CANCELLED"] as const;

export const GET = route(async (req: Request) => {
  await requireUser(req);
  const p = params(req);
  return json(
    await listBookings({
      status: qEnum<BookingStatus>(p, "status", STATUSES),
      from: qDate(p, "from"),
      to: qDate(p, "to"),
      q: qStr(p, "q"),
      customerId: qStr(p, "customerId"),
      cursor: qStr(p, "cursor", 200),
      limit: qLimit(p, 30, 100),
    }),
  );
});

export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  return json({ booking: await createBooking(user, await readJson(req)) }, { status: 201 });
});
