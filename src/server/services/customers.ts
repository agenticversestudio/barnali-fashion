import type { Row } from "@tursodatabase/serverless/compat";
import type { CustomerDto, Role } from "@/types/api";
import { db, type Exec } from "../db";
import { fail } from "../http";
import { nextCounter, pad } from "../ids";
import { likeArg } from "../query";
import { phone as vPhone, str } from "../validate";

export const CUSTOMER_COLS = "id,name,phone,whatsapp,address,city,pincode,notes,created_at";
const opt = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : String(v));

/** Derived stats for a set of customer ids: nothing is stored, so nothing can drift (A9). */
async function stats(ids: string[], x: Exec) {
  const m = new Map<string, { bookings: number; active: number; deposits: number; spent: number }>();
  for (const id of ids) m.set(id, { bookings: 0, active: 0, deposits: 0, spent: 0 });
  if (!ids.length) return m;
  const ph = ids.map(() => "?").join(",");
  const b = await x.execute({
    sql: `SELECT customer_id,
            SUM(CASE WHEN status <> 'CANCELLED' THEN 1 ELSE 0 END) bookings,
            SUM(CASE WHEN status = 'OUT_ON_RENT' THEN 1 ELSE 0 END) active,
            SUM(CASE WHEN status = 'OUT_ON_RENT' THEN deposit_total
                     WHEN status = 'COMPLETED' AND deposit_status = 'HELD' THEN refund_amount ELSE 0 END) deposits
          FROM bookings WHERE customer_id IN (${ph}) GROUP BY customer_id`,
    args: ids,
  });
  for (const r of b.rows) {
    const s = m.get(String(r.customer_id))!;
    s.bookings = Number(r.bookings);
    s.active = Number(r.active);
    s.deposits = Number(r.deposits);
  }
  const p = await x.execute({
    sql: `SELECT b.customer_id, SUM(CASE WHEN p.kind = 'REFUND' THEN -p.amount ELSE p.amount END) net
          FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.customer_id IN (${ph}) GROUP BY b.customer_id`,
    args: ids,
  });
  for (const r of p.rows) m.get(String(r.customer_id))!.spent = Number(r.net);
  return m;
}

export async function customerDtos(rows: Row[], role: Role, x: Exec = db()): Promise<CustomerDto[]> {
  const st = await stats(rows.map((r) => String(r.id)), x);
  return rows.map((r) => {
    const s = st.get(String(r.id))!;
    const dto: CustomerDto = {
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      totalBookings: s.bookings,
      activeRentals: s.active,
      depositsHeld: s.deposits,
      createdAt: String(r.created_at),
    };
    const w = opt(r.whatsapp), a = opt(r.address), c = opt(r.city), pin = opt(r.pincode), n = opt(r.notes);
    if (w) dto.whatsapp = w;
    if (a) dto.address = a;
    if (c) dto.city = c;
    if (pin) dto.pincode = pin;
    if (n) dto.notes = n;
    if (role === "admin") dto.totalSpent = s.spent;
    return dto;
  });
}

export async function searchCustomers(q: string | undefined, limit: number, role: Role): Promise<CustomerDto[]> {
  const args: (string | number)[] = [];
  let where = "";
  if (q) {
    const like = likeArg(q);
    where = "WHERE phone LIKE ? ESCAPE '!' OR name LIKE ? ESCAPE '!' OR id LIKE ? ESCAPE '!'";
    args.push(like, like, like);
  }
  const r = await db().execute({ sql: `SELECT ${CUSTOMER_COLS} FROM customers ${where} ORDER BY name LIMIT ?`, args: [...args, limit] });
  return customerDtos(r.rows, role);
}

export async function getCustomerRow(id: string, x: Exec = db()): Promise<Row> {
  const r = await x.execute({ sql: `SELECT ${CUSTOMER_COLS} FROM customers WHERE id=?`, args: [id] });
  if (!r.rows[0]) return fail("NOT_FOUND", "Customer not found");
  return r.rows[0];
}

export interface CustomerFields {
  id?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
}

/** Validate a customer object from a request body (name+phone required unless `partial`). */
export function parseCustomer(o: Record<string, unknown>, partial = false): CustomerFields {
  return {
    id: str(o, "id", { optional: true, max: 30 }),
    name: str(o, "name", { optional: partial, max: 100 }),
    phone: vPhone(o, "phone", partial),
    whatsapp: vPhone(o, "whatsapp", true),
    address: str(o, "address", { optional: true, max: 300 }),
    city: str(o, "city", { optional: true, max: 80 }),
    pincode: str(o, "pincode", { optional: true, max: 10 }),
    notes: str(o, "notes", { optional: true, max: 1000 }),
  };
}

/** Find by id (if given) or phone; update supplied fields; create if new. Run inside the caller's transaction. */
export async function upsertCustomer(x: Exec, f: CustomerFields): Promise<string> {
  let existing: Row | undefined;
  if (f.id) {
    existing = (await x.execute({ sql: "SELECT id,phone FROM customers WHERE id=?", args: [f.id] })).rows[0];
    if (!existing) return fail("NOT_FOUND", "Customer not found", { field: "customer.id" });
  } else if (f.phone) {
    existing = (await x.execute({ sql: "SELECT id,phone FROM customers WHERE phone=?", args: [f.phone] })).rows[0];
  }
  if (existing) {
    if (f.phone && f.phone !== existing.phone) {
      const clash = await x.execute({ sql: "SELECT 1 FROM customers WHERE phone=? AND id<>?", args: [f.phone, String(existing.id)] });
      if (clash.rows.length) fail("RULE", "Another customer already uses this phone number", { field: "phone" });
    }
    await x.execute({
      sql: `UPDATE customers SET name=COALESCE(?,name), phone=COALESCE(?,phone), whatsapp=COALESCE(?,whatsapp), address=COALESCE(?,address),
            city=COALESCE(?,city), pincode=COALESCE(?,pincode), notes=COALESCE(?,notes) WHERE id=?`,
      args: [f.name ?? null, f.phone ?? null, f.whatsapp ?? null, f.address ?? null, f.city ?? null, f.pincode ?? null, f.notes ?? null, String(existing.id)],
    });
    return String(existing.id);
  }
  if (!f.name || !f.phone) return fail("VALIDATION", "New customer needs name and phone");
  const id = `CUST-${pad(await nextCounter(x, "customer"), 4)}`;
  await x.execute({
    sql: "INSERT INTO customers(id,name,phone,whatsapp,address,city,pincode,notes) VALUES (?,?,?,?,?,?,?,?)",
    args: [id, f.name, f.phone, f.whatsapp ?? null, f.address ?? null, f.city ?? null, f.pincode ?? null, f.notes ?? null],
  });
  return id;
}
