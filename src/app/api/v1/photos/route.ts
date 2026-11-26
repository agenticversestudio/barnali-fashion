import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { registerPhoto } from "@/server/services/photos";

export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  return json({ photo: await registerPhoto(user, await readJson(req)) }, { status: 201 });
});
