import type { Row } from "@tursodatabase/serverless/compat";
import type { CareJobDto, CareKind, GarmentStatus, SessionUser } from "@/types/api";
import { db, tx } from "../db";
import { fail } from "../http";
import { nextCounter, pad, todayIST } from "../ids";
import { PAY_MODES, int, reqDate, reqInt, reqOneOf, str } from "../validate";
import { getGarmentRow } from "./garments";

const KINDS = ["STITCHING", "DRY_CLEAN", "REPAIR"] as const;
const COLS = `c.id,c.garment_id,c.booking_id,c.kind,c.vendor_name,c.sub_type,c.out_date,c.expected_date,c.rcv_date,c.cost,c.notes,c.status,g.name AS g_name`;
const opt = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : String(v));
void PAY_MODES;

function dto(r: Row, today: string): CareJobDto {
  const d: CareJobDto = {
    id: String(r.id), garmentId: String(r.garment_id), garmentName: String(r.g_name), kind: r.kind as CareKind,
    vendorName: String(r.vendor_name), outDate: String(r.out_date), cost: Number(r.cost),
    status: r.status as "OUT" | "RECEIVED",
    isOverdue: r.status === "OUT" && !!r.expected_date && String(r.expected_date) < today,
  };
  const set = (k: "bookingId" | "subType" | "expectedDate" | "rcvDate" | "notes", v: string | undefined) => { if (v !== undefined) d[k] = v; };
  set("bookingId", opt(r.booking_id)); set("subType", opt(r.sub_type)); set("expectedDate", opt(r.expected_date));
  set("rcvDate", opt(r.rcv_date)); set("notes", opt(r.notes));
  return d;
}

export async function listCare(f: { kind?: CareKind; status?: "OUT" | "RECEIVED"; limit: number }): Promise<CareJobDto[]> {
  const where = ["1=1"]; const args: (string | number)[] = [];
  if (f.kind) { where.push("c.kind=?"); args.push(f.kind); }
  if (f.status) { where.push("c.status=?"); args.push(f.status); }
  const r = await db().execute({
    sql: `SELECT ${COLS} FROM care_jobs c JOIN garments g ON g.id=c.garment_id WHERE ${where.join(" AND ")}
          ORDER BY (c.status='OUT') DESC, c.out_date DESC, c.id DESC LIMIT ?`,
    args: [...args, f.limit],
  });
  const today = todayIST();
  return r.rows.map((x) => dto(x, today));
}

async function one(id: string): Promise<CareJobDto> {
  const r = await db().execute({ sql: `SELECT ${COLS} FROM care_jobs c JOIN garments g ON g.id=c.garment_id WHERE c.id=?`, args: [id] });
  if (!r.rows[0]) return fail("NOT_FOUND", "Care job not found");
  return dto(r.rows[0], todayIST());
}

export async function createCare(user: SessionUser, b: Record<string, unknown>): Promise<CareJobDto> {
  const garmentId = String(str(b, "garmentId", { max: 40 })).toUpperCase();
  const kind = reqOneOf(b, "kind", KINDS);
  const vendor = str(b, "vendorName", { max: 120 })!;
  const subType = str(b, "subType", { optional: true, max: 120 }) ?? null;
  const outDate = reqDate(b, "outDate");
  const expected = b.expectedDate === undefined ? null : reqDate(b, "expectedDate");
  if (expected && expected < outDate) fail("VALIDATION", "expectedDate is before outDate", { field: "expectedDate" });
  const cost = int(b, "cost", { optional: true, max: 10_000_000 }) ?? 0;
  const notes = str(b, "notes", { optional: true, max: 1000 }) ?? null;
  const bookingId = str(b, "bookingId", { optional: true, max: 40 }) ?? null;
  const id = await tx(async (x) => {
    const g = await getGarmentRow(garmentId, x);
    const st = g.status as GarmentStatus;
    if (st === "OUT_ON_RENT") fail("RULE", `${garmentId} is out on rent; use the return flow`);
    if (st === "UNAVAILABLE") fail("RULE", `${garmentId} is retired`);
    if (bookingId && !(await x.execute({ sql: "SELECT 1 FROM bookings WHERE id=?", args: [bookingId] })).rows.length) fail("NOT_FOUND", "Booking not found", { field: "bookingId" });
    const cid = `CARE-${pad(await nextCounter(x, "care"), 4)}`;
    await x.execute({
      sql: "INSERT INTO care_jobs(id,garment_id,booking_id,kind,vendor_name,sub_type,out_date,expected_date,cost,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      args: [cid, garmentId, bookingId, kind, vendor, subType, outDate, expected, cost, notes, user.id],
    });
    await x.execute({ sql: "UPDATE garments SET status='IN_CARE', updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", args: [garmentId] });
    return cid;
  });
  return one(id);
}

export async function receiveCare(id: string, b: Record<string, unknown>): Promise<CareJobDto> {
  const rcv = reqDate(b, "rcvDate");
  const next = reqOneOf(b, "nextStatus", ["AVAILABLE", "RETURNED_CLEANING", "DAMAGED_REPAIR"] as const);
  const cost = b.cost === undefined ? null : reqInt(b, "cost", { max: 10_000_000 });
  const notes = str(b, "notes", { optional: true, max: 1000 }) ?? null;
  await tx(async (x) => {
    const r = (await x.execute({ sql: "SELECT garment_id,status,out_date FROM care_jobs WHERE id=?", args: [id] })).rows[0];
    if (!r) fail("NOT_FOUND", "Care job not found");
    if (r.status !== "OUT") fail("RULE", "This job was already received");
    if (rcv < String(r.out_date)) fail("VALIDATION", "rcvDate is before the send-out date", { field: "rcvDate" });
    if (rcv > todayIST()) fail("VALIDATION", "rcvDate cannot be in the future", { field: "rcvDate" });
    await x.execute({
      sql: "UPDATE care_jobs SET status='RECEIVED', rcv_date=?, cost=COALESCE(?,cost), notes=COALESCE(?,notes) WHERE id=?",
      args: [rcv, cost, notes, id],
    });
    const gid = String(r.garment_id);
    const stillOut = (await x.execute({ sql: "SELECT 1 FROM care_jobs WHERE garment_id=? AND status='OUT' LIMIT 1", args: [gid] })).rows.length > 0;
    if (!stillOut) await x.execute({ sql: "UPDATE garments SET status=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND status='IN_CARE'", args: [next, gid] });
  });
  return one(id);
}
