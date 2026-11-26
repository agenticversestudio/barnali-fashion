import { requireUser } from "@/server/auth";
import { fail, json, route } from "@/server/http";
import { daysBetween } from "@/server/pricing";
import { params, qDate, qStr } from "@/server/query";
import { availability } from "@/server/services/garments";

export const GET = route(async (req: Request) => {
  await requireUser(req);
  const p = params(req);
  const from = qDate(p, "from");
  const to = qDate(p, "to");
  if (!from || !to) return fail("VALIDATION", "from and to (YYYY-MM-DD) are required");
  if (to < from) return fail("VALIDATION", "to must not be before from");
  if (daysBetween(from, to) > 62) return fail("VALIDATION", "Window too large (max 62 days)");
  return json({ from, to, rows: await availability(from, to, qStr(p, "category")) });
});
