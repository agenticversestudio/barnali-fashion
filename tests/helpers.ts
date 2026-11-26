import { db } from "@/server/db";

/**
 * Tests run against the Turso DB in .env.local using ids prefixed "ZT".
 * cleanup() removes every ZT row. NEVER run tests against the production DB after go-live
 * (set TURSO_* to a scratch database instead).
 */
export async function cleanup() {
  const c = db();
  const bk = "(SELECT id FROM bookings WHERE id LIKE 'ZT%' OR created_by LIKE 'ZT%')";
  await c.batch(
    [
      "DELETE FROM audit_log WHERE entity_id LIKE 'ZT%' OR user_id LIKE 'ZT%' OR entity_id IN (SELECT id FROM users WHERE username LIKE 'zt!_%' ESCAPE '!')",
      "DELETE FROM photos WHERE garment_id LIKE 'ZT%'",
      `DELETE FROM care_jobs WHERE garment_id LIKE 'ZT%' OR booking_id IN ${bk}`,
      `DELETE FROM payments WHERE booking_id IN ${bk} OR recorded_by LIKE 'ZT%'`,
      `DELETE FROM booking_items WHERE booking_id IN ${bk} OR garment_id LIKE 'ZT%'`,
      "DELETE FROM bookings WHERE id LIKE 'ZT%' OR created_by LIKE 'ZT%'",
      "DELETE FROM customers WHERE id LIKE 'ZT%' OR phone LIKE '7999%' OR phone LIKE '9000%' OR phone LIKE '0000%'",
      "DELETE FROM garments WHERE id LIKE 'ZT%'",
      "DELETE FROM expenses WHERE id LIKE 'ZT%' OR recorded_by LIKE 'ZT%'",
      "DELETE FROM cash_closings WHERE id LIKE 'ZT%' OR verified_by LIKE 'ZT%'",
      "DELETE FROM sessions WHERE user_id LIKE 'ZT%' OR user_id IN (SELECT id FROM users WHERE username LIKE 'zt!_%' ESCAPE '!')",
      "DELETE FROM users WHERE id LIKE 'ZT%' OR username LIKE 'zt!_%' ESCAPE '!'",
    ],
    "write",
  );
}

export async function baseFixtures() {
  const c = db();
  await c.batch(
    [
      "INSERT INTO users(id,name,username,password_hash,role) VALUES ('ZT-U1','Test Admin','zt_admin','x','admin')",
      "INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('ZT-G1','Test G1','Lehenga','M','A-1',3500,4000),('ZT-G2','Test G2','Lehenga','M','A-2',2000,2000)",
      "INSERT INTO customers(id,name,phone) VALUES ('ZT-C1','Test Cust','0000000001')",
    ],
    "write",
  );
}

export async function addBooking(id: string, pickup: string, due: string) {
  await db().execute({
    sql: `INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,rental_total,deposit_total,created_by)
          VALUES (?, 'ZT-C1','Test',?,?,?,0,0,'ZT-U1')`,
    args: [id, due, pickup, due],
  });
}

export async function addItem(bookingId: string, garmentId: string, pickup: string, due: string, active = 1) {
  return db().execute({
    sql: `INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date,active)
          VALUES (?,?,1,1,?,?,?)`,
    args: [bookingId, garmentId, pickup, due, active],
  });
}

import { hashPassword } from "@/server/password";
import type { Role } from "@/types/api";

export async function mkUser(id: string, username: string, role: Role, password = "TestPass#1", extra = "") {
  await db().execute({
    sql: "INSERT INTO users(id,name,username,password_hash,role) VALUES (?,?,?,?,?)",
    args: [id, `Test ${username}`, username, await hashPassword(password), role],
  });
  void extra;
}

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

/** Call a route handler directly (no HTTP server). */
export async function call(
  handler: Handler,
  method: string,
  path: string,
  opts: { body?: unknown; cookie?: string; params?: Record<string, string>; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const req = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const res = await handler(req, { params: Promise.resolve(opts.params ?? {}) });
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, headers: res.headers };
}

export function cookieOf(res: { headers: Headers }): string {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}
