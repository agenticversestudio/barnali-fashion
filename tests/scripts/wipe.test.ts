import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, sqliteConn } from "../../scripts/lib/target";

const dir = mkdtempSync(join(tmpdir(), "bf-wipe-"));
const dbFile = join(dir, "w.scratch.db");
const script = resolve("scripts/wipe-data.ts");
const run = (...a: string[]) => spawnSync(process.execPath, ["--no-warnings", script, ...a, "--sqlite", dbFile], { encoding: "utf8", cwd: dir });
const count = async (t: string) => {
  const c = sqliteConn(dbFile);
  const n = Number((await c.query(`SELECT COUNT(*) n FROM ${t}`))[0].n);
  c.close();
  return n;
};

beforeAll(async () => {
  const c = sqliteConn(dbFile);
  await applyMigrations(c);
  const S = (sql: string) => c.run([{ sql }]);
  await S("INSERT INTO users(id,name,username,password_hash,role) VALUES ('U1','Admin','admin','x','admin')");
  await S("INSERT INTO settings(key,value) VALUES ('late_fee_percent','15')");
  await S("INSERT INTO counters(name,value) VALUES ('booking-2026',130),('care',5),('expense',9),('customer',12),('user',3)");
  await S("INSERT INTO customers(id,name,phone) VALUES ('C1','A','9876543210')");
  await S("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit) VALUES ('G1','G','Saree','M','R',1000,500)");
  await S("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,rental_total,deposit_total,created_by) VALUES ('B1','C1','E','2027-01-02','2027-01-01','2027-01-03',1000,500,'U1')");
  await S("INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date) VALUES ('B1','G1',1000,500,'2027-01-01','2027-01-03')");
  await S("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('B1','ADVANCE',500,'CASH','2027-01-01','U1')");
  await S("INSERT INTO audit_log(user_id,action,entity,entity_id) VALUES ('U1','x','booking','B1')");
  c.close();
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("wipe-data.ts", () => {
  it("refuses without --yes-wipe and changes nothing", async () => {
    const r = run();
    expect(r.status).toBe(2);
    expect(await count("garments")).toBe(1);
  });

  it("backs up first, wipes business data, keeps users/settings, resets counters", async () => {
    const r = run("--yes-wipe", "--booking-start", "0");
    expect(r.status, r.stderr + r.stdout).toBe(0);
    const backups = readdirSync(join(dir, "backups"));
    expect(backups.some((f) => f.startsWith("pre-wipe-"))).toBe(true);
    expect(existsSync(join(dir, "backups", backups[0]))).toBe(true);
    for (const t of ["garments", "customers", "bookings", "booking_items", "payments", "audit_log"]) expect(await count(t), t).toBe(0);
    expect(await count("users")).toBe(1);
    expect(await count("settings")).toBe(1);
    const c = sqliteConn(dbFile);
    const counters = Object.fromEntries((await c.query("SELECT name,value FROM counters")).map((x) => [x.name, x.value]));
    c.close();
    const year = new Date().getFullYear();
    expect(counters).toMatchObject({ [`booking-${year}`]: 0, care: 0, expense: 0, customer: 0, user: 3 });
    expect(r.stdout).toContain(`BF-BK-${year}-001`);
  });

  it("the pre-wipe backup restores the old data (undo works)", async () => {
    const backups = readdirSync(join(dir, "backups"));
    const r = spawnSync(process.execPath, ["--no-warnings", resolve("scripts/restore.ts"), join(dir, "backups", backups[0]), "--sqlite", dbFile, "--force"], { encoding: "utf8", cwd: dir });
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(await count("garments")).toBe(1);
    expect(await count("bookings")).toBe(1);
  });
});
