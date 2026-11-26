import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { params, qDate, qLimit } from "@/server/query";
import { listClosings } from "@/server/services/cash";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  const p = params(req);
  return json({ closings: await listClosings({ from: qDate(p, "from"), to: qDate(p, "to"), limit: qLimit(p, 60, 400) }) });
});
