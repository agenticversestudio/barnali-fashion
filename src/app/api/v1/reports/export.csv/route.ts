import { requireAdmin } from "@/server/auth";
import { route } from "@/server/http";
import { params, qEnum } from "@/server/query";
import { DATASETS, dataset, toCsv } from "@/server/services/exports";
import { fail } from "@/server/http";

/** GET /reports/export.csv?type=bookings|payments|cashclosings|expenses|garments|customers */
export const GET = route(async (req: Request) => {
  await requireAdmin(req);
  const type = qEnum(params(req), "type", DATASETS) ?? fail("VALIDATION", `type is required: ${DATASETS.join(", ")}`);
  const d = await dataset(type);
  return new Response(toCsv(d), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="barnali-${type}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
