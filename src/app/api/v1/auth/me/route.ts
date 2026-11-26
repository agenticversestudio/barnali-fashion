import { requireUser } from "@/server/auth";
import { json, route } from "@/server/http";
import type { MeResponse } from "@/types/api";

export const GET = route(async (req: Request) => {
  const user = await requireUser(req);
  const res: MeResponse = { user };
  return json(res);
});
