process.env.STORAGE_DRIVER = "fake";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { fakeStorage } from "@/server/storage";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as presign } from "@/app/api/v1/photos/presign/route";
import { POST as register } from "@/app/api/v1/photos/route";
import { DELETE as del } from "@/app/api/v1/photos/[id]/route";
import { GET as listGarments } from "@/app/api/v1/garments/route";
import { GET as getGarment } from "@/app/api/v1/garments/[id]/route";
import { call, cleanup, cookieOf, mkUser } from "../helpers";

let A = "";
let S = "";
const pre = (cookie: string, body: unknown) => call(presign as never, "POST", "/api/v1/photos/presign", { cookie, body });
const reg = (cookie: string, body: unknown) => call(register as never, "POST", "/api/v1/photos", { cookie, body });

/** presign + (simulated browser PUT) + register */
async function upload(cookie: string, kind = "MAIN", garmentId = "ZT-PG1", bytes = 100_000) {
  const p = await pre(cookie, { garmentId, kind, contentType: "image/webp", bytes });
  expect(p.status).toBe(200);
  fakeStorage.put(p.data.objectKey, bytes);
  return reg(cookie, { objectKey: p.data.objectKey, kind, garmentId });
}

beforeAll(async () => {
  await cleanup();
  await mkUser("ZT-A1", "zt_admin", "admin");
  await mkUser("ZT-S1", "zt_staff", "staff");
  await db().execute("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('ZT-PG1','Photo G','Lehenga','M','R',1000,500),('ZT-PG2','Photo G2','Saree','M','R',1000,500)");
  const lg = (u: string) => call(login as never, "POST", "/api/v1/auth/login", { body: { username: u, password: "TestPass#1" } });
  S = cookieOf(await lg("zt_staff"));
  A = cookieOf(await lg("zt_admin"));
});
afterAll(async () => {
  fakeStorage.clear();
  await cleanup();
});

describe("presign", () => {
  it("returns an upload url and a garment-scoped key", async () => {
    const r = await pre(S, { garmentId: "ZT-PG1", kind: "FRONT", contentType: "image/webp", bytes: 50_000 });
    expect(r.status).toBe(200);
    expect(r.data.objectKey).toMatch(/^garments\/ZT-PG1\/[0-9a-f-]{36}\.webp$/);
    expect(r.data.uploadUrl).toContain(r.data.objectKey);
  });
  it("rejects > 400 KB, bad content type, unknown garment, missing garment for garment kinds", async () => {
    expect((await pre(S, { garmentId: "ZT-PG1", kind: "MAIN", contentType: "image/webp", bytes: 400 * 1024 + 1 })).status).toBe(400);
    expect((await pre(S, { garmentId: "ZT-PG1", kind: "MAIN", contentType: "image/png", bytes: 1000 })).status).toBe(400);
    expect((await pre(S, { garmentId: "ZT-NOPE", kind: "MAIN", contentType: "image/webp", bytes: 1000 })).status).toBe(404);
    expect((await pre(S, { kind: "MAIN", contentType: "image/webp", bytes: 1000 })).status).toBe(400);
  });
  it("exactly 400 KB is accepted; handover photo without garment goes to misc/", async () => {
    expect((await pre(S, { garmentId: "ZT-PG1", kind: "DETAIL", contentType: "image/jpeg", bytes: 400 * 1024 })).status).toBe(200);
    const m = await pre(S, { kind: "HANDOVER", contentType: "image/jpeg", bytes: 1000 });
    expect(m.data.objectKey).toMatch(/^misc\/[0-9a-f-]{36}\.jpg$/);
  });
});

describe("register", () => {
  it("registers an uploaded photo and returns a signed url", async () => {
    const r = await upload(S, "MAIN");
    expect(r.status).toBe(201);
    expect(r.data.photo.kind).toBe("MAIN");
    expect(r.data.photo.url).toMatch(/^fake:\/\/get\/garments\/ZT-PG1\//);
  });
  it("refuses a key that was never uploaded (422)", async () => {
    const p = await pre(S, { garmentId: "ZT-PG1", kind: "BACK", contentType: "image/webp", bytes: 1000 });
    expect((await reg(S, { objectKey: p.data.objectKey, kind: "BACK", garmentId: "ZT-PG1" })).status).toBe(422);
  });
  it("refuses duplicate registration, forged keys, and key/garment mismatch", async () => {
    const p = await pre(S, { garmentId: "ZT-PG2", kind: "FRONT", contentType: "image/webp", bytes: 1000 });
    fakeStorage.put(p.data.objectKey, 1000);
    expect((await reg(S, { objectKey: p.data.objectKey, kind: "FRONT", garmentId: "ZT-PG2" })).status).toBe(201);
    expect((await reg(S, { objectKey: p.data.objectKey, kind: "FRONT", garmentId: "ZT-PG2" })).status).toBe(422);
    expect((await reg(S, { objectKey: "garments/ZT-PG2/../../etc/passwd", kind: "FRONT" })).status).toBe(400);
    expect((await reg(S, { objectKey: "garments/ZT-PG1/00000000-0000-0000-0000-000000000000.webp", kind: "FRONT", garmentId: "ZT-PG2" })).status).toBe(400);
  });
  it("deletes an oversize object that slipped through the presign (actual size checked)", async () => {
    const p = await pre(S, { garmentId: "ZT-PG2", kind: "DETAIL", contentType: "image/webp", bytes: 1000 });
    fakeStorage.put(p.data.objectKey, 900_000);
    expect((await reg(S, { objectKey: p.data.objectKey, kind: "DETAIL", garmentId: "ZT-PG2" })).status).toBe(400);
    expect(fakeStorage.has(p.data.objectKey)).toBe(false);
  });
});

describe("limit of 8 photos per garment", () => {
  it("9th presign and 9th register are refused", async () => {
    const have = Number((await db().execute("SELECT COUNT(*) c FROM photos WHERE garment_id='ZT-PG1'")).rows[0].c);
    for (let i = have; i < 8; i++) expect((await upload(S, "DETAIL")).status).toBe(201);
    expect((await pre(S, { garmentId: "ZT-PG1", kind: "DETAIL", contentType: "image/webp", bytes: 1000 })).status).toBe(422);
  });
});

describe("embedding in DTOs", () => {
  it("garment list + detail carry mainPhotoUrl; detail has photos[] with MAIN first", async () => {
    const l = await call(listGarments as never, "GET", "/api/v1/garments?q=Photo%20G", { cookie: S });
    const g1 = l.data.garments.find((g: { id: string }) => g.id === "ZT-PG1");
    expect(g1.mainPhotoUrl).toMatch(/^fake:\/\/get\/garments\/ZT-PG1\//);
    const d = await call(getGarment as never, "GET", "/api/v1/garments/ZT-PG1", { cookie: S, params: { id: "ZT-PG1" } });
    expect(d.data.garment.photos.length).toBe(8);
    expect(d.data.garment.photos[0].kind).toBe("MAIN");
    expect(d.data.garment.mainPhotoUrl).toBe(d.data.garment.photos[0].url);
  });
  it("a garment with only FRONT uses it; one with none has no mainPhotoUrl", async () => {
    const l = await call(listGarments as never, "GET", "/api/v1/garments?q=Photo%20G2", { cookie: S });
    const g2 = l.data.garments.find((g: { id: string }) => g.id === "ZT-PG2");
    expect(g2.mainPhotoUrl).toMatch(/ZT-PG2/);
    await db().execute("DELETE FROM photos WHERE garment_id='ZT-PG2'");
    const l2 = await call(listGarments as never, "GET", "/api/v1/garments?q=Photo%20G2", { cookie: S });
    expect(l2.data.garments.find((g: { id: string }) => g.id === "ZT-PG2").mainPhotoUrl).toBeUndefined();
  });
});

describe("delete (admin only)", () => {
  it("staff 403; admin deletes row and object; second delete 404", async () => {
    const r = await upload(A, "FRONT", "ZT-PG2");
    const id = r.data.photo.id;
    const key = String((await db().execute({ sql: "SELECT object_key FROM photos WHERE id=?", args: [id] })).rows[0].object_key);
    expect((await call(del as never, "DELETE", `/api/v1/photos/${id}`, { cookie: S, params: { id } })).status).toBe(403);
    expect((await call(del as never, "DELETE", `/api/v1/photos/${id}`, { cookie: A, params: { id } })).status).toBe(200);
    expect(fakeStorage.has(key)).toBe(false);
    expect((await db().execute({ sql: "SELECT 1 FROM photos WHERE id=?", args: [id] })).rows.length).toBe(0);
    expect((await call(del as never, "DELETE", `/api/v1/photos/${id}`, { cookie: A, params: { id } })).status).toBe(404);
  });
  it("no session → 401", async () => {
    expect((await call(presign as never, "POST", "/api/v1/photos/presign", { body: {} })).status).toBe(401);
  });
});
