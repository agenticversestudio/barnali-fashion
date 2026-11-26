import { requireAdmin, requireUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { GARMENT_COLS, garmentDto, getGarmentDetail, getGarmentRow } from "@/server/services/garments";
import { int, str } from "@/server/validate";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  return json({ garment: await getGarmentDetail(id, user.role) });
});

/** Admin edit. Price / deposit / purchase-cost changes are written to audit_log. */
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params;
  const b = await readJson(req);
  const t = (k: string, max: number) => str(b, k, { optional: true, max });
  const rental = int(b, "rentalPrice", { optional: true, min: 1, max: 1_000_000 });
  const deposit = int(b, "securityDeposit", { optional: true, max: 1_000_000 });
  const cost = int(b, "purchaseCost", { optional: true, max: 10_000_000 });
  const active = typeof b.active === "boolean" ? b.active : undefined;
  if (b.active !== undefined && active === undefined) fail("VALIDATION", "active: must be true or false", { field: "active" });

  const row = await tx(async (x) => {
    const before = await getGarmentRow(id, x);
    if (active === false) {
      const open = await x.execute({ sql: "SELECT 1 FROM booking_items WHERE garment_id=? AND active=1 LIMIT 1", args: [id] });
      if (open.rows.length) fail("RULE", "This garment has active bookings; cancel or complete them first");
    }
    await x.execute({
      sql: `UPDATE garments SET name=COALESCE(?,name), category=COALESCE(?,category), description=COALESCE(?,description), fabric=COALESCE(?,fabric),
              colour=COALESCE(?,colour), size=COALESCE(?,size), chest=COALESCE(?,chest), waist=COALESCE(?,waist), length=COALESCE(?,length),
              blouse_size=COALESCE(?,blouse_size), rack=COALESCE(?,rack), shelf=COALESCE(?,shelf), condition=COALESCE(?,condition), notes=COALESCE(?,notes),
              rental_price=COALESCE(?,rental_price), security_deposit=COALESCE(?,security_deposit), purchase_cost=COALESCE(?,purchase_cost),
              active=COALESCE(?,active), updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`,
      args: [t("name", 120) ?? null, t("category", 60) ?? null, t("description", 1000) ?? null, t("fabric", 80) ?? null, t("colour", 60) ?? null, t("size", 40) ?? null,
        t("chest", 20) ?? null, t("waist", 20) ?? null, t("length", 20) ?? null, t("blouseSize", 20) ?? null, t("rack", 60) ?? null, t("shelf", 40) ?? null,
        t("condition", 40) ?? null, t("notes", 1000) ?? null, rental ?? null, deposit ?? null, cost ?? null, active === undefined ? null : active ? 1 : 0, id],
    });
    const after = (await x.execute({ sql: `SELECT ${GARMENT_COLS} FROM garments WHERE id=?`, args: [id] })).rows[0];
    const money = (r: typeof before) => ({ rental: r.rental_price, deposit: r.security_deposit, cost: r.purchase_cost });
    if (JSON.stringify(money(before)) !== JSON.stringify(money(after))) await audit(x, admin.id, "garment.price", "garment", id, money(before), money(after));
    return after;
  });
  return json({ garment: garmentDto(row, "admin") });
});
