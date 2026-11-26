// Usage: node --env-file=.env.local scripts/seed.ts [--demo]
// Idempotent. Always: settings, counters, first admin. With --demo: garments + customers from the prototype mock data.
import { createClient } from "@tursodatabase/serverless/compat";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/server/password.ts";

const demo = process.argv.includes("--demo");
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set");
const db = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });

const settings: Record<string, string> = {
  late_fee_percent: "15",
  buffer_days: "1",
  shop_name: "Barnali Fashion",
  shop_address: "Bargarh, Odisha",
  shop_phone: "",
  default_care_vendor: "",
};
for (const [k, v] of Object.entries(settings))
  await db.execute({ sql: "INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)", args: [k, v] });

// booking-2026 starts at 80 so the first booking is BF-BK-2026-081 (matches prototype numbering)
const counters: Record<string, number> = { "booking-2026": 80, care: 0, expense: 0, customer: 0, user: 1 };
for (const [k, v] of Object.entries(counters))
  await db.execute({ sql: "INSERT OR IGNORE INTO counters(name,value) VALUES (?,?)", args: [k, v] });

const hasAdmin = Number((await db.execute("SELECT COUNT(*) n FROM users WHERE role='admin'")).rows[0].n) > 0;
if (!hasAdmin) {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  let password = process.env.SEED_ADMIN_PASSWORD;
  const generated = !password;
  if (!password) password = randomBytes(9).toString("base64url");
  await db.execute({
    sql: "INSERT INTO users(id,name,username,password_hash,role) VALUES (?,?,?,?,'admin')",
    args: ["USR-0001", "Owner", username, await hashPassword(password)],
  });
  console.log(
    `admin created: username=${username}` + (generated ? ` password=${password}  (generated, shown once)` : ""),
  );
} else console.log("admin exists, skipped");

if (demo) {
  const src = readFileSync(new URL("../src/lib/mockData.ts", import.meta.url), "utf8");
  const a = src.indexOf("export const INITIAL_GARMENTS");
  const b = src.indexOf("export const INITIAL_BOOKINGS");
  const body =
    src.slice(a, b).replace(/export const (\w+): \w+\[\] =/g, "const $1 =") +
    "\nreturn { INITIAL_GARMENTS, INITIAL_CUSTOMERS };";
  const { INITIAL_GARMENTS, INITIAL_CUSTOMERS } = new Function(body)() as {
    INITIAL_GARMENTS: Record<string, any>[];
    INITIAL_CUSTOMERS: Record<string, any>[];
  };
  const stmts: { sql: string; args: unknown[] }[] = [];
  for (const g of INITIAL_GARMENTS) {
    const status = g.status === "DAMAGED_REPAIR" || g.status === "UNAVAILABLE" ? g.status : "AVAILABLE";
    stmts.push({
      sql: `INSERT OR IGNORE INTO garments(id,name,category,description,colour,size,chest,waist,length,blouse_size,rack,purchase_cost,rental_price,security_deposit,status,condition,notes)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        g.id, g.productName, g.category, g.notes ?? null, g.colour ?? null, g.size,
        g.chest ?? null, g.waist ?? null, g.length ?? null, g.blouseSize ?? null,
        g.storageLocation ?? "Unassigned", g.purchasePrice ?? 0, g.rentalPrice, g.securityDeposit,
        status, g.condition ?? "Excellent", g.notes ?? null,
      ],
    });
  }
  let n = 0;
  for (const c of INITIAL_CUSTOMERS) {
    n++;
    stmts.push({
      sql: "INSERT OR IGNORE INTO customers(id,name,phone,whatsapp,address,city,pincode,notes) VALUES (?,?,?,?,?,?,?,?)",
      args: [
        `CUST-${String(n).padStart(4, "0")}`, c.name, c.phone, c.whatsapp ?? null,
        c.address ?? null, c.city ?? null, c.pincode ?? null, c.notes ?? null,
      ],
    });
  }
  stmts.push({ sql: "UPDATE counters SET value = MAX(value, ?) WHERE name='customer'", args: [n] });
  await db.batch(stmts as any, "write");
  console.log(`demo: ${INITIAL_GARMENTS.length} garments, ${INITIAL_CUSTOMERS.length} customers`);
}
console.log("seed done");
