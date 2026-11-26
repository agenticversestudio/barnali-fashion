import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { receiveCare } from "@/server/services/care";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser(req);
  const { id } = await ctx.params;
  return json({ job: await receiveCare(id, await readJson(req)) });
});
