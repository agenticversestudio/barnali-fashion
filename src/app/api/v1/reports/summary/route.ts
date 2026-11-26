import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { params, qDate } from "@/server/query";
import { reportSummary } from "@/server/services/reports";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  const p = params(req);
  return json(await reportSummary(qDate(p, "from"), qDate(p, "to")));
});
