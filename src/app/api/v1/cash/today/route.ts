import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { params, qDate } from "@/server/query";
import { cashToday } from "@/server/services/cash";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  return json(await cashToday(qDate(params(req), "date")));
});
