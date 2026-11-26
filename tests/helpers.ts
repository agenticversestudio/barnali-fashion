import { db } from "@/server/db";

/**
 * Tests run against the Turso DB in .env.local using ids prefixed "ZT".
 * cleanup() removes every ZT row. NEVER run tests against the production DB after go-live
 * (set TURSO_* to a scratch database instead).
 */
export async function cleanup() {
  const c = db();
  const ids = "id LIKE 'ZT%'";
  await c.batch(
    [
      "DELETE FROM audit_log WHERE entity_id LIKE 'ZT%' OR user_id LIKE 'ZT%'",
      "DELETE FROM photos WHERE garment_id LIKE 'ZT%'",
      "DELETE FROM care_jobs WHERE garment_id LIKE 'ZT%'",
      "DELETE FROM payments WHERE booking_id LIKE 'ZT%' OR recorded_by LIKE 'ZT%'",
      "DELETE FROM booking_items WHERE booking_id LIKE 'ZT%'",
      `DELETE FROM bookings WHERE ${ids}`,
      `DELETE FROM customers WHERE ${ids}`,
      `DELETE FROM garments WHERE ${ids}`,
      "DELETE FROM sessions WHERE user_id LIKE 'ZT%'",
      `DELETE FROM users WHERE ${ids}`,
      "DELETE FROM expenses WHERE id LIKE 'ZT%'",
      "DELETE FROM cash_closings WHERE id LIKE 'ZT%'",
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
