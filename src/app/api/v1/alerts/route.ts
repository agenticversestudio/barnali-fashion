import { requireUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { getAlerts } from "@/server/services/alerts";

export const GET = route(async (req: Request) => {
  await requireUser(req);
  return json({ alerts: await getAlerts() });
});
