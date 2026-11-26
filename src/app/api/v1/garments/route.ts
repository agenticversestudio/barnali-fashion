import { requireAdmin, requireUser } from "@/server/auth";
import { audit } from "@/server/audit";
import { tx } from "@/server/db";
import { fail, json, readJson, route } from "@/server/http";
import { params, qDate, qEnum, qLimit, qStr } from "@/server/query";
import { GARMENT_COLS, garmentDto, listGarments } from "@/server/services/garments";
import { req as reqStr, reqInt, str, int } from "@/server/validate";
import type { GarmentStatus } from "@/types/api";

const STATUSES = ["AVAILABLE", "OUT_ON_RENT", "RETURNED_CLEANING", "IN_CARE", "DAMAGED_REPAIR", "UNAVAILABLE"] as const;

export const GET = route(async (req: Request) => {
  const user = await requireUser(req);
  const p = params(req);
  const out = await listGarments(
    {
      q: qStr(p, "q"),
      category: qStr(p, "category"),
      status: qEnum<GarmentStatus>(p, "status", STATUSES),
      rack: qStr(p, "rack"),
      availableFrom: qDate(p, "availableFrom"),
      availableTo: qDate(p, "availableTo"),
      cursor: qStr(p, "cursor"),
      limit: qLimit(p),
    },
    user.role,
  );
  return json(out);
});

export const POST = route(async (req: Request) => {
  const admin = await requireAdmin(req);
  const b = await readJson(req);
  const id = reqStr(b, "id", { min: 2, max: 30 }).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(id)) fail("VALIDATION", "id: letters, numbers and - only (e.g. LF-001)", { field: "id" });
  const vals = {
    name: reqStr(b, "name", { max: 120 }),
    category: reqStr(b, "category", { max: 60 }),
    size: reqStr(b, "size", { max: 40 }),
    rack: reqStr(b, "rack", { max: 60 }),
    rental: reqInt(b, "rentalPrice", { min: 1, max: 1_000_000 }),
    deposit: reqInt(b, "securityDeposit", { max: 1_000_000 }),
    cost: int(b, "purchaseCost", { optional: true, max: 10_000_000 }) ?? 0,
  };
  const o = (k: string, max = 300) => str(b, k, { optional: true, max }) ?? null;
  const row = await tx(async (t) => {
    const dup = await t.execute({ sql: "SELECT 1 FROM garments WHERE id=?", args: [id] });
    if (dup.rows.length) fail("RULE", `A garment with id ${id} already exists`, { field: "id" });
    await t.execute({
      sql: `INSERT INTO garments(id,name,category,description,fabric,colour,size,chest,waist,length,blouse_size,rack,shelf,purchase_cost,rental_price,security_deposit,condition,notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [id, vals.name, vals.category, o("description", 1000), o("fabric", 80), o("colour", 60), vals.size, o("chest", 20), o("waist", 20), o("length", 20), o("blouseSize", 20),
        vals.rack, o("shelf", 40), vals.cost, vals.rental, vals.deposit, str(b, "condition", { optional: true, max: 40 }) ?? "Excellent", o("notes", 1000)],
    });
    await audit(t, admin.id, "garment.create", "garment", id, undefined, { rental: vals.rental, deposit: vals.deposit, cost: vals.cost });
    return (await t.execute({ sql: `SELECT ${GARMENT_COLS} FROM garments WHERE id=?`, args: [id] })).rows[0];
  });
  return json({ garment: garmentDto(row, "admin") }, { status: 201 });
});
