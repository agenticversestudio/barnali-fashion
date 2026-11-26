import type { Row } from "@tursodatabase/serverless/compat";
import type { AvailabilityRow, BookingStatus, GarmentDetailDto, GarmentDto, GarmentStatus, Role } from "@/types/api";
import { db, type Exec } from "../db";
import { fail } from "../http";
import { likeArg } from "../query";
import { todayIST } from "../ids";
import { garmentPhotos, mainPhotoUrls } from "./photos";

export const BUFFER_DAYS = 1; // must match the trigger in db/migrations/001_init.sql

export const GARMENT_COLS =
  "id,name,category,description,fabric,colour,size,chest,waist,length,blouse_size,rack,shelf,purchase_cost,rental_price,security_deposit,status,condition,notes,active";

const opt = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : String(v));

/** Row → DTO. `purchaseCost` is only included for admin (staff redaction). */
export function garmentDto(r: Row, role: Role): GarmentDto {
  const dto: GarmentDto = {
    id: String(r.id),
    name: String(r.name),
    category: String(r.category),
    size: String(r.size),
    rack: String(r.rack),
    rentalPrice: Number(r.rental_price),
    securityDeposit: Number(r.security_deposit),
    status: r.status as GarmentStatus,
    condition: String(r.condition),
    active: Boolean(Number(r.active)),
  };
  const set = <K extends keyof GarmentDto>(k: K, v: GarmentDto[K] | undefined) => {
    if (v !== undefined) dto[k] = v;
  };
  set("description", opt(r.description));
  set("fabric", opt(r.fabric));
  set("colour", opt(r.colour));
  set("chest", opt(r.chest));
  set("waist", opt(r.waist));
  set("length", opt(r.length));
  set("blouseSize", opt(r.blouse_size));
  set("shelf", opt(r.shelf));
  set("notes", opt(r.notes));
  if (role === "admin") dto.purchaseCost = Number(r.purchase_cost);
  return dto;
}

export interface GarmentFilter {
  q?: string;
  category?: string;
  status?: GarmentStatus;
  rack?: string;
  availableFrom?: string;
  availableTo?: string;
  cursor?: string;
  limit: number;
}

/** Next upcoming/current booking per garment id (earliest active item whose return is today or later). */
export async function nextBookings(ids: string[], x: Exec = db()): Promise<Map<string, NonNullable<GarmentDto["nextBooking"]>>> {
  const out = new Map<string, NonNullable<GarmentDto["nextBooking"]>>();
  if (!ids.length) return out;
  const r = await x.execute({
    sql: `SELECT bi.garment_id, bi.booking_id, bi.pickup_date, bi.return_due_date, c.name AS customer
          FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id JOIN customers c ON c.id = b.customer_id
          WHERE bi.active = 1 AND bi.return_due_date >= ? AND bi.garment_id IN (${ids.map(() => "?").join(",")})
          ORDER BY bi.pickup_date`,
    args: [todayIST(), ...ids],
  });
  for (const row of r.rows) {
    const gid = String(row.garment_id);
    if (!out.has(gid))
      out.set(gid, { bookingId: String(row.booking_id), from: String(row.pickup_date), to: String(row.return_due_date), customerName: String(row.customer) });
  }
  return out;
}

export async function listGarments(f: GarmentFilter, role: Role): Promise<{ garments: GarmentDto[]; nextCursor?: string }> {
  const where: string[] = ["g.active = 1"];
  const args: (string | number)[] = [];
  if (f.q) {
    const like = likeArg(f.q);
    where.push("(g.id LIKE ? ESCAPE '!' OR g.name LIKE ? ESCAPE '!' OR g.colour LIKE ? ESCAPE '!' OR g.category LIKE ? ESCAPE '!' OR g.size LIKE ? ESCAPE '!' OR g.rack LIKE ? ESCAPE '!')");
    args.push(like, like, like, like, like, like);
  }
  if (f.category) { where.push("g.category = ?"); args.push(f.category); }
  if (f.status) { where.push("g.status = ?"); args.push(f.status); }
  if (f.rack) { where.push("g.rack LIKE ? ESCAPE '!'"); args.push(likeArg(f.rack)); }
  if (f.availableFrom || f.availableTo) {
    const from = f.availableFrom ?? f.availableTo!;
    const to = f.availableTo ?? f.availableFrom!;
    if (to < from) fail("VALIDATION", "availableTo must not be before availableFrom");
    where.push("g.status NOT IN ('DAMAGED_REPAIR','UNAVAILABLE')");
    where.push(
      `NOT EXISTS (SELECT 1 FROM booking_items o WHERE o.garment_id = g.id AND o.active = 1
         AND ? <= date(o.return_due_date, '+${BUFFER_DAYS} day') AND date(?, '+${BUFFER_DAYS} day') >= o.pickup_date)`,
    );
    args.push(from, to);
  }
  if (f.cursor) { where.push("g.id > ?"); args.push(f.cursor); }
  const r = await db().execute({
    sql: `SELECT ${GARMENT_COLS.split(",").map((c) => `g.${c}`).join(",")} FROM garments g WHERE ${where.join(" AND ")} ORDER BY g.id LIMIT ?`,
    args: [...args, f.limit + 1],
  });
  const rows = r.rows.slice(0, f.limit);
  const next = await nextBookings(rows.map((x) => String(x.id)));
  const mains = await mainPhotoUrls(rows.map((x) => String(x.id)));
  const garments = rows.map((row) => {
    const dto = garmentDto(row, role);
    const nb = next.get(dto.id);
    if (nb) dto.nextBooking = nb;
    const mp = mains.get(dto.id);
    if (mp) dto.mainPhotoUrl = mp;
    return dto;
  });
  return { garments, nextCursor: r.rows.length > f.limit ? garments[garments.length - 1].id : undefined };
}

export async function getGarmentRow(id: string, x: Exec = db()): Promise<Row> {
  const r = await x.execute({ sql: `SELECT ${GARMENT_COLS} FROM garments WHERE id = ?`, args: [id] });
  if (!r.rows[0]) return fail("NOT_FOUND", "Garment not found");
  return r.rows[0];
}

export async function getGarmentDetail(id: string, role: Role): Promise<GarmentDetailDto> {
  const row = await getGarmentRow(id);
  const base = garmentDto(row, role);
  const nb = (await nextBookings([id])).get(id);
  if (nb) base.nextBooking = nb;
  const photos = await garmentPhotos(id);
  const main = photos.find((p) => p.kind === "MAIN" || p.kind === "FRONT");
  if (main) base.mainPhotoUrl = main.url;
  const h = await db().execute({
    sql: `SELECT bi.booking_id, bi.pickup_date, bi.return_due_date, b.status, c.name AS customer, bi.rental_price
          FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id JOIN customers c ON c.id = b.customer_id
          WHERE bi.garment_id = ? ORDER BY bi.pickup_date DESC LIMIT 20`,
    args: [id],
  });
  const detail: GarmentDetailDto = {
    ...base,
    photos,
    history: h.rows.map((x) => ({
      bookingId: String(x.booking_id),
      from: String(x.pickup_date),
      to: String(x.return_due_date),
      status: x.status as BookingStatus,
      customerName: String(x.customer),
    })),
  };
  if (role === "admin") {
    const s = await db().execute({
      sql: `SELECT COUNT(*) n, COALESCE(SUM(bi.rental_price),0) rev FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id
            WHERE bi.garment_id = ? AND b.status IN ('OUT_ON_RENT','COMPLETED')`,
      args: [id],
    });
    const revenue = Number(s.rows[0].rev);
    detail.stats = { timesRented: Number(s.rows[0].n), revenue, profit: revenue - Number(row.purchase_cost) };
  }
  return detail;
}

/** Calendar matrix data: for each garment, the active bookings that touch [from, to]. */
export async function availability(from: string, to: string, category?: string): Promise<AvailabilityRow[]> {
  const g = await db().execute({
    sql: `SELECT id,name,category,rack,status FROM garments WHERE active = 1 ${category ? "AND category = ?" : ""} ORDER BY id`,
    args: category ? [category] : [],
  });
  const b = await db().execute({
    sql: `SELECT bi.garment_id, bi.booking_id, bi.pickup_date, bi.return_due_date, b.status
          FROM booking_items bi JOIN bookings b ON b.id = bi.booking_id
          WHERE bi.active = 1 AND bi.pickup_date <= ? AND bi.return_due_date >= ? ORDER BY bi.pickup_date`,
    args: [to, from],
  });
  const busy = new Map<string, AvailabilityRow["busy"]>();
  for (const r of b.rows) {
    const k = String(r.garment_id);
    if (!busy.has(k)) busy.set(k, []);
    busy.get(k)!.push({ bookingId: String(r.booking_id), from: String(r.pickup_date), to: String(r.return_due_date), status: r.status as BookingStatus });
  }
  return g.rows.map((r) => ({
    garmentId: String(r.id),
    name: String(r.name),
    category: String(r.category),
    rack: String(r.rack),
    status: r.status as GarmentStatus,
    busy: busy.get(String(r.id)) ?? [],
  }));
}

/** Manual status changes staff may make. OUT_ON_RENT is only ever set by the pickup flow. */
export const MANUAL_TRANSITIONS: Record<GarmentStatus, GarmentStatus[]> = {
  AVAILABLE: ["DAMAGED_REPAIR", "UNAVAILABLE"],
  OUT_ON_RENT: [],
  RETURNED_CLEANING: ["AVAILABLE", "IN_CARE", "DAMAGED_REPAIR"],
  IN_CARE: ["RETURNED_CLEANING", "DAMAGED_REPAIR"],
  DAMAGED_REPAIR: ["AVAILABLE", "RETURNED_CLEANING", "UNAVAILABLE"],
  UNAVAILABLE: ["AVAILABLE"],
};
