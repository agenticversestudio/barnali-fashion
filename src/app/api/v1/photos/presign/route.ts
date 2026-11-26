import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { presign } from "@/server/services/photos";

export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  return json(await presign(user, await readJson(req)));
});
