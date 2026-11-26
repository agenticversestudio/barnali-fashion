import { createHash } from "node:crypto";
import type { Conn, SqlValue, Stmt } from "./target.ts";

/** Parent tables first (FK-safe insert order). `sessions` is deliberately excluded: logins are not worth preserving. */
export const TABLE_ORDER = [
  "users", "settings", "counters", "customers", "garments", "bookings", "booking_items", "payments",
  "care_jobs", "photos", "expenses", "cash_closings", "audit_log", "sync_log",
] as const;
export const SKIPPED_TABLES = ["sessions", "_migrations"];
const CHUNK = 200;

export interface Backup {
  meta: { format: 1; createdAt: string; migrations: string[]; counts: Record<string, number>; sha256: string };
  tables: Record<string, { columns: string[]; rows: SqlValue[][] }>;
}

const q = (id: string) => `"${id.replace(/"/g, '""')}"`;
const digest = (tables: Backup["tables"]) => createHash("sha256").update(JSON.stringify(tables)).digest("hex");

/** Every table in the DB must be either backed up or explicitly skipped, so a new table can never be silently left out. */
async function assertCoverage(c: Conn) {
  const names = (await c.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")).map((r) => String(r.name));
  const unknown = names.filter((n) => !(TABLE_ORDER as readonly string[]).includes(n) && !SKIPPED_TABLES.includes(n));
  if (unknown.length) throw new Error(`Tables not covered by backup: ${unknown.join(", ")}. Add them to TABLE_ORDER in scripts/lib/backup-core.ts.`);
}

export async function dump(c: Conn): Promise<Backup> {
  await assertCoverage(c);
  const tables: Backup["tables"] = {};
  const counts: Record<string, number> = {};
  for (const t of TABLE_ORDER) {
    const rows = await c.query(`SELECT * FROM ${q(t)} ORDER BY rowid`);
    const columns = rows.length ? Object.keys(rows[0]) : (await c.query(`PRAGMA table_info(${q(t)})`)).map((r) => String(r.name));
    tables[t] = { columns, rows: rows.map((r) => columns.map((k) => (r[k] ?? null) as SqlValue)) };
    counts[t] = rows.length;
  }
  const migrations = (await c.query("SELECT name FROM _migrations ORDER BY name")).map((r) => String(r.name));
  return { meta: { format: 1, createdAt: new Date().toISOString(), migrations, counts, sha256: digest(tables) }, tables };
}

export function verifyBackup(b: Backup): void {
  if (b?.meta?.format !== 1) throw new Error("Unsupported or corrupt backup file (format)");
  if (digest(b.tables) !== b.meta.sha256) throw new Error("Backup checksum mismatch: file is corrupt or was edited");
  for (const t of TABLE_ORDER) {
    if (!b.tables[t]) throw new Error(`Backup is missing table ${t}`);
    if (b.tables[t].rows.length !== b.meta.counts[t]) throw new Error(`Backup row count mismatch for ${t}`);
  }
}

export interface RestoreOptions {
  force?: boolean;
  dryRun?: boolean;
}
export interface RestoreReport {
  restored: Record<string, number>;
  wiped: boolean;
  dryRun: boolean;
}

export async function restore(c: Conn, b: Backup, opt: RestoreOptions = {}): Promise<RestoreReport> {
  verifyBackup(b);
  await assertCoverage(c);
  const have = new Set((await c.query("SELECT name FROM _migrations")).map((r) => String(r.name)));
  const missing = b.meta.migrations.filter((m) => !have.has(m));
  if (missing.length) throw new Error(`Target DB is missing migrations: ${missing.join(", ")}. Run the migrations first.`);

  const nonEmpty: string[] = [];
  for (const t of TABLE_ORDER) {
    if (Number((await c.query(`SELECT COUNT(*) AS n FROM ${q(t)}`))[0].n) > 0) nonEmpty.push(t);
  }
  if (nonEmpty.length && !opt.force) throw new Error(`Target DB is not empty (${nonEmpty.join(", ")}). Restore into a fresh database, or pass --force to wipe it first.`);
  const restored: Record<string, number> = {};
  for (const t of TABLE_ORDER) restored[t] = b.tables[t].rows.length;
  if (opt.dryRun) return { restored, wiped: false, dryRun: true };

  if (nonEmpty.length) {
    await c.run([{ sql: "DELETE FROM sessions" }, ...[...TABLE_ORDER].reverse().map((t): Stmt => ({ sql: `DELETE FROM ${q(t)}` }))]);
  }
  for (const t of TABLE_ORDER) {
    const { columns, rows } = b.tables[t];
    const sql = `INSERT INTO ${q(t)} (${columns.map(q).join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
    for (let i = 0; i < rows.length; i += CHUNK) await c.run(rows.slice(i, i + CHUNK).map((args): Stmt => ({ sql, args })));
  }
  for (const t of TABLE_ORDER) {
    const n = Number((await c.query(`SELECT COUNT(*) AS n FROM ${q(t)}`))[0].n);
    if (n !== restored[t]) throw new Error(`Post-restore count mismatch for ${t}: expected ${restored[t]}, found ${n}`);
  }
  return { restored, wiped: nonEmpty.length > 0, dryRun: false };
}
