import { requireUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { json, readJson, route } from "@/server/http";
import { GARMENT_COLS, garmentDto, getGarmentRow } from "@/server/services/garments";
import { req as reqStr, str } from "@/server/validate";

/** Rack locating: staff may move a garment between racks/shelves. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const b = await readJson(req);
  const rack = reqStr(b, "rack", { max: 60 });
  const shelf = str(b, "shelf", { optional: true, max: 40 }) ?? null;
  const row = await tx(async (x) => {
    const before = await getGarmentRow(id, x);
    await x.execute({ sql: "UPDATE garments SET rack=?, shelf=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", args: [rack, shelf, id] });
    await audit(x, user.id, "garment.location", "garment", id, { rack: before.rack, shelf: before.shelf }, { rack, shelf });
    return (await x.execute({ sql: `SELECT ${GARMENT_COLS} FROM garments WHERE id=?`, args: [id] })).rows[0];
  });
  return json({ garment: garmentDto(row, user.role) });
});
