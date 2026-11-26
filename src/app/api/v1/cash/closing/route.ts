import { requireAdmin } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { closeCash } from "@/server/services/cash";

export const POST = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  return json({ closing: await closeCash(admin, await readJson(req)) }, { status: 201 });
});
