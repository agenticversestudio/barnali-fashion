// Generates a realistic-size shop (default: 500 garments, 2000 customers, 6000 bookings over ~2.5 years) in a scratch DB.
// Used by the query-plan audit / perf check (T8.3). Never run against production.
import type { Conn, SqlValue, Stmt } from "./target.ts";

export interface ScaleOptions {
  garments?: number;
  customers?: number;
  bookings?: number;
}

// small deterministic PRNG so runs are repeatable
function rng(seed = 42) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const addDays = (d: string, n: number) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);

export async function seedScale(c: Conn, o: ScaleOptions = {}): Promise<{ garments: number; customers: number; bookings: number; items: number; payments: number }> {
  const G = o.garments ?? 500, C = o.customers ?? 2000, B = o.bookings ?? 6000;
  const r = rng();
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const stmts: Stmt[] = [];
  const add = (sql: string, ...args: SqlValue[]) => stmts.push({ sql, args });

  add("INSERT INTO users(id,name,username,password_hash,role) VALUES ('U-SCALE','Scale Admin','scale_admin','x','admin')");
  const cats = ["Lehenga", "Saree", "Sherwani", "Gown", "Kurta Set", "Indo-Western"];
  for (let i = 1; i <= G; i++) {
    add("INSERT INTO garments(id,name,category,colour,size,rack,shelf,rental_price,security_deposit,purchase_cost,status) VALUES (?,?,?,?,?,?,?,?,?,?, 'AVAILABLE')",
      `SK-${String(i).padStart(4, "0")}`, `${pick(["Royal", "Zari", "Silk", "Velvet", "Bridal"])} ${pick(cats)} ${i}`, pick(cats), pick(["Red", "Maroon", "Gold", "Green", "Blue"]),
      pick(["S", "M", "L", "XL"]), `Rack ${pick(["A", "B", "C", "D"])}-${1 + Math.floor(r() * 20)}`, `Shelf ${1 + Math.floor(r() * 4)}`, 1500 + Math.floor(r() * 8) * 500, 1000 + Math.floor(r() * 4) * 500, 5000 + Math.floor(r() * 20) * 500);
  }
  for (let i = 1; i <= C; i++) add("INSERT INTO customers(id,name,phone,city) VALUES (?,?,?,?)", `CUST-${String(i).padStart(5, "0")}`, `Customer ${i}`, `98${String(10000000 + i * 37).slice(-8)}`, pick(["Bargarh", "Sambalpur", "Bhubaneswar"]));

  // non-overlapping (with 1-day buffer) slots per garment
  const busy = new Map<string, [string, string][]>();
  const free = (g: string, p: string, d: string) => !(busy.get(g) ?? []).some(([bp, bd]) => p <= addDays(bd, 1) && addDays(d, 1) >= bp);
  const start = "2025-01-01";
  let items = 0, payments = 0, made = 0, itemId = 0;
  for (let b = 1; b <= B && made < B; b++) {
    const pickup = addDays(start, Math.floor(r() * 900));
    const due = addDays(pickup, 1 + Math.floor(r() * 4));
    const wanted = 1 + (r() < 0.3 ? 1 : 0);
    const gs: string[] = [];
    for (let t = 0; t < 40 && gs.length < wanted; t++) {
      const g = `SK-${String(1 + Math.floor(r() * G)).padStart(4, "0")}`;
      if (!gs.includes(g) && free(g, pickup, due)) gs.push(g);
    }
    if (!gs.length) continue;
    made++;
    const id = `BF-BK-S-${String(made).padStart(5, "0")}`;
    const today = "2026-11-26";
    const past = due < today;
    const status = pickup > today ? "CONFIRMED" : past ? (r() < 0.04 ? "CANCELLED" : "COMPLETED") : "OUT_ON_RENT";
    const rent = gs.length * 2500, dep = gs.length * 1500;
    add("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,actual_return_date,status,rental_total,deposit_total,late_fee,refund_amount,deposit_status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, `CUST-${String(1 + Math.floor(r() * C)).padStart(5, "0")}`, "Wedding", addDays(pickup, 1), pickup, due, status === "COMPLETED" ? due : null, status, rent, dep, 0, status === "COMPLETED" ? dep : 0, status === "COMPLETED" ? "REFUNDED" : "HELD", "U-SCALE", `${pickup}T05:00:00.000Z`);
    for (const g of gs) {
      add("INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date,active) VALUES (?,?,?,?,?,?,?)", id, g, 2500, 1500, pickup, due, status === "CONFIRMED" || status === "OUT_ON_RENT" ? 1 : 0);
      if (status === "CONFIRMED" || status === "OUT_ON_RENT") (busy.get(g) ?? busy.set(g, []).get(g)!).push([pickup, due]);
      items++;
      itemId++;
    }
    for (const [kind, amt, on] of [["ADVANCE", 1000, addDays(pickup, -5)], ["BALANCE", rent - 1000 + dep, pickup]] as [string, number, string][]) {
      if (on > today) continue;
      add("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES (?,?,?,?,?,?)", id, kind, amt, pick(["CASH", "UPI", "CASH"]), on, "U-SCALE");
      payments++;
    }
  }
  for (let i = 1; i <= 1500; i++) add("INSERT INTO care_jobs(id,garment_id,kind,vendor_name,out_date,expected_date,status,created_by) VALUES (?,?,?,?,?,?,?,?)", `CARE-S${i}`, `SK-${String(1 + Math.floor(r() * G)).padStart(4, "0")}`, pick(["DRY_CLEAN", "REPAIR", "STITCHING"]), "Vendor", addDays(start, Math.floor(r() * 900)), addDays(start, Math.floor(r() * 900) + 3), i > 1480 ? "OUT" : "RECEIVED", "U-SCALE");
  for (let i = 1; i <= 1200; i++) add("INSERT INTO expenses(id,date,category,description,amount,mode,recorded_by) VALUES (?,?,?,?,?,?,?)", `EXP-S${i}`, addDays(start, Math.floor(r() * 900)), pick(["Rent", "Salary", "Dry clean", "Misc"]), "x", 100 + Math.floor(r() * 5000), "CASH", "U-SCALE");
  for (let i = 1; i <= 800; i++) add("INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES ('U-SCALE','booking.edit','booking',?)", `BF-BK-S-${String(1 + Math.floor(r() * made)).padStart(5, "0")}`);

  const CH = 2000;
  for (let i = 0; i < stmts.length; i += CH) await c.run(stmts.slice(i, i + CH));
  return { garments: G, customers: C, bookings: made, items, payments };
}
