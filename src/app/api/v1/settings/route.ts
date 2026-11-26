import { requireAdmin, requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { getSettings, updateSettings } from "@/server/services/settings";

export const GET = route(async (req: Request) => {
  await requireUser(req);
  return json({ settings: await getSettings() });
});

export const PATCH = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  return json({ settings: await updateSettings(admin, await readJson(req)) });
});
