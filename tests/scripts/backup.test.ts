import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TABLE_ORDER, dump, restore, verifyBackup, type Backup } from "../../scripts/lib/backup-core";
import { applyMigrations, sqliteConn, type Conn } from "../../scripts/lib/target";

const dir = mkdtempSync(join(tmpdir(), "bf-backup-"));
const path = (n: string) => join(dir, n);
let src: Conn;

async function fresh(name: string): Promise<Conn> {
  const c = sqliteConn(path(name));
  await applyMigrations(c);
  return c;
}

beforeAll(async () => {
  src = await fresh("src.scratch.db");
  const S = (sql: string, ...args: (string | number | null)[]) => src.run([{ sql, args }]);
  await S("INSERT INTO users(id,name,username,password_hash,role) VALUES ('U1','Admin','admin','pbkdf2$1$x$y','admin')");
  await S("INSERT INTO sessions(token_hash,user_id,expires_at,last_seen) VALUES ('h','U1','2999-01-01','2026-01-01')");
  await S("INSERT INTO settings(key,value) VALUES ('late_fee_percent','15')");
  await S("INSERT INTO counters(name,value) VALUES ('booking-2026',80)");
  await S("INSERT INTO customers(id,name,phone) VALUES ('C1','Asha ''Quote'' Devi','9876543210')");
  await S("INSERT INTO garments(id,name,category,size,rack,rental_price,security_deposit,purchase_cost) VALUES ('G1','Red Lehenga, \"zari\"','Lehenga','M','A-1',2000,1000,9000)");
  await S("INSERT INTO bookings(id,customer_id,event_name,event_date,pickup_date,return_due_date,rental_total,deposit_total,created_by) VALUES ('B1','C1','Wedding','2027-02-10','2027-02-08','2027-02-11',2000,1000,'U1')");
  await S("INSERT INTO booking_items(booking_id,garment_id,rental_price,security_deposit,pickup_date,return_due_date) VALUES ('B1','G1',2000,1000,'2027-02-08','2027-02-11')");
  await S("INSERT INTO payments(booking_id,kind,amount,mode,paid_on,recorded_by) VALUES ('B1','ADVANCE',500,'CASH','2027-01-01','U1')");
  await S("INSERT INTO care_jobs(id,garment_id,booking_id,kind,vendor_name,out_date,created_by) VALUES ('CARE-0001','G1','B1','DRY_CLEAN','Vendor','2027-02-12','U1')");
  await S("INSERT INTO photos(id,garment_id,kind,object_key,created_by) VALUES ('P1','G1','MAIN','garments/G1/x.webp','U1')");
  await S("INSERT INTO expenses(id,date,category,description,amount,mode,recorded_by) VALUES ('EXP-0001','2027-01-02','Rent','Shop, rent',5000,'CASH','U1')");
  await S("INSERT INTO cash_closings(id,date,opening_cash,cash_in,cash_refunds,cash_expenses,expected_cash,actual_cash,variance,verified_by) VALUES ('CC-2027-01-02','2027-01-02',0,500,0,5000,-4500,-4500,0,'U1')");
  await S("INSERT INTO audit_log(user_id,action,entity,entity_id,before,after) VALUES ('U1','x','booking','B1','{\"a\":1}',NULL)");
  await S("INSERT INTO sync_log(trigger,status) VALUES ('MANUAL','OK')");
});
afterAll(() => {
  src.close();
  rmSync(dir, { recursive: true, force: true });
});

const all = async (c: Conn) => Object.fromEntries(await Promise.all(TABLE_ORDER.map(async (t) => [t, await c.query(`SELECT * FROM "${t}" ORDER BY rowid`)])));

describe("backup → restore round trip (scratch SQLite)", () => {
  it("restores every table byte-for-byte into a fresh DB; sessions are not carried over", async () => {
    const b = await dump(src);
    expect(b.meta.counts.garments).toBe(1);
    expect(b.meta.counts).not.toHaveProperty("sessions");
    const file = gzipSync(JSON.stringify(b)); // what backup.ts writes
    const loaded = JSON.parse(gunzipSync(file).toString()) as Backup;

    const dst = await fresh("dst1.scratch.db");
    const rep = await restore(dst, loaded);
    expect(rep.wiped).toBe(false);
    expect(await all(dst)).toEqual(await all(src));
    expect((await dst.query("SELECT COUNT(*) n FROM sessions"))[0].n).toBe(0);
    dst.close();
  });

  it("dry-run writes nothing", async () => {
    const dst = await fresh("dst2.scratch.db");
    const rep = await restore(dst, await dump(src), { dryRun: true });
    expect(rep.dryRun).toBe(true);
    expect((await dst.query("SELECT COUNT(*) n FROM garments"))[0].n).toBe(0);
    dst.close();
  });

  it("refuses a non-empty target; --force wipes and restores", async () => {
    const dst = await fresh("dst3.scratch.db");
    await dst.run([{ sql: "INSERT INTO settings(key,value) VALUES ('junk','1')" }]);
    const b = await dump(src);
    await expect(restore(dst, b)).rejects.toThrow(/not empty/);
    const rep = await restore(dst, b, { force: true });
    expect(rep.wiped).toBe(true);
    expect(await all(dst)).toEqual(await all(src));
    dst.close();
  });

  it("detects a corrupted or edited backup before touching the target", async () => {
    const b = await dump(src);
    const bad = JSON.parse(JSON.stringify(b)) as Backup;
    bad.tables.expenses.rows[0][4] = 1; // tamper with an amount
    expect(() => verifyBackup(bad)).toThrow(/checksum/);
    const dst = await fresh("dst4.scratch.db");
    await expect(restore(dst, bad)).rejects.toThrow(/checksum/);
    expect((await dst.query("SELECT COUNT(*) n FROM expenses"))[0].n).toBe(0);
    dst.close();
  });

  it("refuses a target that lacks the backup's migrations", async () => {
    const dst = sqliteConn(path("dst5.scratch.db")); // no migrations at all
    await dst.run([{ sql: "CREATE TABLE _migrations (name TEXT PRIMARY KEY)" }]);
    await expect(restore(dst, await dump(src))).rejects.toThrow(/missing migrations/);
    dst.close();
  });

  it("a table added later without updating the backup list is caught, not silently skipped", async () => {
    const c = await fresh("dst6.scratch.db");
    await c.run([{ sql: "CREATE TABLE brand_new (id TEXT)" }]);
    await expect(dump(c)).rejects.toThrow(/not covered by backup/);
    c.close();
  });
});

describe("CLI scripts end to end", () => {
  it("backup.ts then restore.ts on scratch files; --keep prunes old backups", () => {
    const run = (script: string, ...a: string[]) => execFileSync(process.execPath, ["--no-warnings", script, ...a], { encoding: "utf8", cwd: process.cwd() });
    const out = path("bk");
    const o1 = run("scripts/backup.ts", "--sqlite", path("src.scratch.db"), "--out", out);
    expect(o1).toMatch(/backup .*barnali-\d{8}-\d{6}\.json\.gz/);
    const files = readdirSync(out);
    expect(files.length).toBe(1);

    // fake two older backups, then --keep 2 must prune the oldest
    writeFileSync(join(out, "barnali-20200101-000000.json.gz"), "x");
    writeFileSync(join(out, "barnali-20200102-000000.json.gz"), "x");
    run("scripts/backup.ts", "--sqlite", path("src.scratch.db"), "--out", out, "--keep", "2");
    expect(readdirSync(out).filter((f) => f.includes("20200101"))).toEqual([]);

    const newest = readdirSync(out).sort().reverse()[0];
    const dstFile = path("cli.scratch.db");
    const c = sqliteConn(dstFile);
    return applyMigrations(c).then(() => {
      c.close();
      const r = run("scripts/restore.ts", join(out, newest), "--sqlite", dstFile);
      expect(r).toContain("restore OK");
      const back = sqliteConn(dstFile);
      return back.query("SELECT name FROM garments").then((rows) => {
        back.close();
        expect(rows[0].name).toBe('Red Lehenga, "zari"');
        expect(readFileSync(join(out, newest)).length).toBeGreaterThan(100);
      });
    });
  });
});
