import { requireUser } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { params, qEnum, qLimit } from "@/server/query";
import { createCare, listCare } from "@/server/services/care";

export const GET = route(async (req: Request) => {
  await requireUser(req);
  const p = params(req);
  return json({
    jobs: await listCare({
      kind: qEnum(p, "kind", ["STITCHING", "DRY_CLEAN", "REPAIR"] as const),
      status: qEnum(p, "status", ["OUT", "RECEIVED"] as const),
      limit: qLimit(p, 100, 300),
    }),
  });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser(req);
  return json({ job: await createCare(user, await readJson(req)) }, { status: 201 });
});
