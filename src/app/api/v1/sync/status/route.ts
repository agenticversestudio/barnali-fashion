import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { syncStatus } from "@/server/sheets";

export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  return json(await syncStatus());
});