import { requireUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { GARMENT_COLS, MANUAL_TRANSITIONS, garmentDto, getGarmentRow } from "@/server/services/garments";
import { reqOneOf, str } from "@/server/validate";
import type { GarmentStatus } from "@/types/api";

const STATUSES = ["AVAILABLE", "OUT_ON_RENT", "RETURNED_CLEANING", "IN_CARE", "DAMAGED_REPAIR", "UNAVAILABLE"] as const;

/** Manual status change, allowed transitions only. Retiring / un-retiring (UNAVAILABLE) is admin only. */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const b = await readJson(req);
  const to = reqOneOf(b, "status", STATUSES) as GarmentStatus;
  const note = str(b, "note", { optional: true, max: 300 });
  const row = await tx(async (x) => {
    const cur = await getGarmentRow(id, x);
    const from = cur.status as GarmentStatus;
    if (from === to) return cur;
    if (!MANUAL_TRANSITIONS[from].includes(to))
      fail("RULE", `Cannot change ${from} to ${to} by hand${from === "OUT_ON_RENT" ? " (use the return flow)" : ""}`, { from, to, allowed: MANUAL_TRANSITIONS[from] });
    if ((to === "UNAVAILABLE" || from === "UNAVAILABLE") && user.role !== "admin") fail("FORBIDDEN", "Only the owner can retire or restore a garment");
    await x.execute({ sql: "UPDATE garments SET status=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", args: [to, id] });
    await audit(x, user.id, "garment.status", "garment", id, { status: from }, { status: to, note });
    return (await x.execute({ sql: `SELECT ${GARMENT_COLS} FROM garments WHERE id=?`, args: [id] })).rows[0];
  });
  return json({ garment: garmentDto(row, user.role) });
});
