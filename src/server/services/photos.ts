import { randomUUID } from "node:crypto";
import type { PhotoDto, PresignRequest, PresignResponse, RegisterPhotoRequest, SessionUser } from "@/types/api";
import { db } from "../db";
import { audit } from "../audit";
import { fail } from "../http";
import { GET_TTL, PUT_TTL, storage } from "../storage";
import { reqInt, reqOneOf, str } from "../validate";

export const MAX_PHOTOS_PER_GARMENT = 8;
export const MAX_PHOTO_BYTES = 400 * 1024;
export const KINDS = ["MAIN", "FRONT", "BACK", "DETAIL", "HANDOVER", "DAMAGE", "STITCH_NOTE"] as const;
const TYPES = ["image/webp", "image/jpeg"] as const;
const KEY_RE = /^(garments\/[A-Za-z0-9_-]{1,40}|misc)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/;

async function garmentPhotoCount(garmentId: string): Promise<number> {
  return Number((await db().execute({ sql: "SELECT COUNT(*) c FROM photos WHERE garment_id=?", args: [garmentId] })).rows[0].c);
}
async function assertGarment(id: string) {
  if (!(await db().execute({ sql: "SELECT 1 FROM garments WHERE id=?", args: [id] })).rows[0]) fail("NOT_FOUND", "Garment not found");
}

export async function presign(_user: SessionUser, body: unknown): Promise<PresignResponse> {
  const b = body as Record<string, unknown>;
  const kind = reqOneOf(b, "kind", KINDS) as PresignRequest["kind"];
  const contentType = reqOneOf(b, "contentType", TYPES);
  const bytes = reqInt(b, "bytes", { min: 1 });
  const garmentId = str(b, "garmentId", { optional: true, max: 40 });
  if (bytes > MAX_PHOTO_BYTES) fail("VALIDATION", `Photo too large: compress to ${MAX_PHOTO_BYTES / 1024} KB or less`, { field: "bytes", max: MAX_PHOTO_BYTES });
  if (!garmentId && ["MAIN", "FRONT", "BACK", "DETAIL"].includes(kind)) fail("VALIDATION", "garmentId is required for this kind", { field: "garmentId" });
  if (garmentId) {
    await assertGarment(garmentId);
    if ((await garmentPhotoCount(garmentId)) >= MAX_PHOTOS_PER_GARMENT)
      fail("RULE", `A garment can have at most ${MAX_PHOTOS_PER_GARMENT} photos. Delete one first.`, { max: MAX_PHOTOS_PER_GARMENT });
  }
  const objectKey = `${garmentId ? `garments/${garmentId}` : "misc"}/${randomUUID()}.${contentType === "image/webp" ? "webp" : "jpg"}`;
  return { uploadUrl: await storage().presignPut(objectKey, contentType, PUT_TTL), objectKey };
}

export async function photoDto(r: { id: unknown; kind: unknown; object_key: unknown; note?: unknown }): Promise<PhotoDto> {
  const dto: PhotoDto = { id: String(r.id), kind: String(r.kind), url: await storage().presignGet(String(r.object_key), GET_TTL) };
  if (r.note) dto.note = String(r.note);
  return dto;
}

/** Called after the browser PUT. Verifies the object really exists and is small enough before the row is written. */
export async function registerPhoto(user: SessionUser, body: unknown): Promise<PhotoDto> {
  const b = body as Record<string, unknown>;
  const objectKey = str(b, "objectKey", { max: 200 });
  if (!objectKey || !KEY_RE.test(objectKey)) return fail("VALIDATION", "Invalid objectKey", { field: "objectKey" });
  const kind = reqOneOf(b, "kind", KINDS) as RegisterPhotoRequest["kind"];
  const keyGarment = objectKey.startsWith("garments/") ? objectKey.split("/")[1] : undefined;
  const garmentId = str(b, "garmentId", { optional: true, max: 40 }) ?? keyGarment;
  if (garmentId !== keyGarment) fail("VALIDATION", "objectKey does not belong to this garment", { field: "garmentId" });
  const bookingId = str(b, "bookingId", { optional: true, max: 40 });
  const careJobId = str(b, "careJobId", { optional: true, max: 40 });
  const note = str(b, "note", { optional: true, max: 300 });
  if (garmentId) {
    await assertGarment(garmentId);
    if ((await garmentPhotoCount(garmentId)) >= MAX_PHOTOS_PER_GARMENT) fail("RULE", `A garment can have at most ${MAX_PHOTOS_PER_GARMENT} photos.`);
  }
  if (bookingId && !(await db().execute({ sql: "SELECT 1 FROM bookings WHERE id=?", args: [bookingId] })).rows[0]) fail("NOT_FOUND", "Booking not found");
  if (careJobId && !(await db().execute({ sql: "SELECT 1 FROM care_jobs WHERE id=?", args: [careJobId] })).rows[0]) fail("NOT_FOUND", "Care job not found");
  if ((await db().execute({ sql: "SELECT 1 FROM photos WHERE object_key=?", args: [objectKey] })).rows[0]) fail("RULE", "This upload was already registered");

  const head = await storage().head(objectKey);
  if (!head) fail("RULE", "Upload not found in storage. Upload the file first, then register it.", { field: "objectKey" });
  if (head!.bytes > MAX_PHOTO_BYTES) {
    await storage().remove(objectKey).catch(() => undefined);
    fail("VALIDATION", `Uploaded file is ${Math.round(head!.bytes / 1024)} KB; the limit is ${MAX_PHOTO_BYTES / 1024} KB`, { field: "bytes" });
  }
  const id = randomUUID();
  await db().execute({
    sql: "INSERT INTO photos(id,garment_id,booking_id,care_job_id,kind,object_key,bytes,note,created_by) VALUES (?,?,?,?,?,?,?,?,?)",
    args: [id, garmentId ?? null, bookingId ?? null, careJobId ?? null, kind, objectKey, head!.bytes, note ?? null, user.id],
  });
  return photoDto({ id, kind, object_key: objectKey, note });
}

/** Admin only. DB row first (so the UI never shows a broken image), then the object; a leftover object is harmless. */
export async function deletePhoto(user: SessionUser, id: string): Promise<void> {
  const r = (await db().execute({ sql: "SELECT id,garment_id,kind,object_key FROM photos WHERE id=?", args: [id] })).rows[0];
  if (!r) return fail("NOT_FOUND", "Photo not found");
  await db().execute({ sql: "DELETE FROM photos WHERE id=?", args: [id] });
  await audit(db(), user.id, "PHOTO_DELETE", "photo", id, { garmentId: r.garment_id, kind: r.kind });
  await storage().remove(String(r.object_key)).catch(() => undefined);
}

export async function garmentPhotos(garmentId: string): Promise<PhotoDto[]> {
  const rows = (await db().execute({ sql: "SELECT id,kind,object_key,note FROM photos WHERE garment_id=? ORDER BY (kind='MAIN') DESC, sort, created_at", args: [garmentId] })).rows;
  return Promise.all(rows.map((r) => photoDto({ id: r.id, kind: r.kind, object_key: r.object_key, note: r.note })));
}

/** garmentId → signed URL of its MAIN (else FRONT) photo, newest wins. One query for a whole list. */
export async function mainPhotoUrls(garmentIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!garmentIds.length) return out;
  const rows = (await db().execute({
    sql: `SELECT garment_id, object_key FROM photos WHERE garment_id IN (${garmentIds.map(() => "?").join(",")}) AND kind IN ('MAIN','FRONT')
          ORDER BY (kind='MAIN') DESC, created_at DESC`,
    args: garmentIds,
  })).rows;
  for (const r of rows) {
    const g = String(r.garment_id);
    if (!out.has(g)) out.set(g, await storage().presignGet(String(r.object_key), GET_TTL));
  }
  return out;
}
