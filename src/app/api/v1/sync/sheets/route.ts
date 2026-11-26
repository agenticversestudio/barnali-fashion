import { requireAdmin } from "@/server/auth";
import { json, route } from "@/server/http";
import { syncSheets } from "@/server/sheets";

export const maxDuration = 60;

/** Admin "Sync now" button. */
export const POST = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  return json(await syncSheets({ trigger: "MANUAL", user: admin }));
});
