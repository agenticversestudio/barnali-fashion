// Usage: SQL_CAPTURE=file vitest ... (captures app SQL), then:
//   node scripts/perf-audit.ts <captured.jsonl> [--runs 20]
// Builds a scratch SQLite DB at realistic shop size, EXPLAINs every distinct statement the app runs, flags full table scans
// on large tables, and times each SELECT (p95). Scratch DB only; never touches Turso.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyMigrations, sqliteConn } from "./lib/target.ts";
import { seedScale } from "./lib/scale-data.ts";
import { DatabaseSync } from "node:sqlite";

const file = process.argv[2];
if (!file) throw new Error("Usage: perf-audit.ts <captured.jsonl> [--runs N]");
const runs = process.argv.includes("--runs") ? Number(process.argv[process.argv.indexOf("--runs") + 1]) : 20;

const dir = mkdtempSync(join(tmpdir(), "bf-perf-"));
const path = join(dir, "scale.scratch.db");
const c = sqliteConn(path);
await applyMigrations(c);
const t0 = Date.now();
console.log("seeded", await seedScale(c), `in ${Date.now() - t0} ms`);
c.close();

const d = new DatabaseSync(path);
d.exec("ANALYZE");
const BIG = ["bookings", "booking_items", "payments", "garments", "customers", "care_jobs", "expenses", "audit_log", "photos"];
const norm = (s: string) => s.replace(/\s+/g, " ").replace(/IN \((\?,?\s*)+\)/g, "IN (?…)").trim();
const seen = new Map<string, { sql: string; args: unknown[] }>();
for (const line of readFileSync(file, "utf8").split("\n").filter(Boolean)) {
  const s = JSON.parse(line) as { sql: string; args: unknown[] };
  // prefer an example whose args are populated and which has the most args (e.g. longest IN list)
  const k = norm(s.sql);
  if (!seen.has(k) || (seen.get(k)!.args.length < s.args.length)) seen.set(k, s);
}

// Full scans that are deliberate. Anything else on a large table fails the audit.
const ALLOWED: [RegExp, string][] = [
  [/'ZT|Racer/, "assertion queries written by the test suite, not the app"],
  [/FROM customers WHERE .*LIKE/, "free-text customer search: %term% cannot use an index; catalogue is a few thousand rows"],
  [/^SELECT COUNT\(\*\) c FROM garments WHERE active=1/, "garment count for utilisation: the whole catalogue is <= ~600 rows"],
  [/^SELECT [^()]* FROM (payments|expenses|customers|garments|cash_closings) ORDER BY [\w, ]+$/, "full CSV / Google Sheet export: reads everything by design"],
  [/^SELECT b\.id,b\.status,c\.name customer/, "full bookings export for CSV / Sheet"],
];
let flagged = 0;
const rows: { ms: number; sql: string; plan: string[] }[] = [];
for (const [k, s] of seen) {
  const args = s.args.map((a) => (typeof a === "boolean" ? Number(a) : a)) as (string | number | null)[];
  let plan: string[];
  try {
    plan = (d.prepare("EXPLAIN QUERY PLAN " + s.sql).all(...args) as { detail: string }[]).map((r) => r.detail);
  } catch (e) {
    console.log("skip (cannot explain):", k.slice(0, 80), String((e as Error).message).slice(0, 60));
    continue;
  }
  const scans = plan.filter((p) => /^SCAN /.test(p) && !/USING (COVERING )?INDEX/.test(p) && BIG.includes(p.replace(/^SCAN (\S+).*/, "$1").replace(/ AS .*/, "")));
  // time SELECTs only
  let ms = 0;
  if (/^\s*(SELECT|WITH)/i.test(s.sql)) {
    const st = d.prepare(s.sql);
    const ts: number[] = [];
    for (let i = 0; i < runs; i++) {
      const a = performance.now();
      st.all(...args);
      ts.push(performance.now() - a);
    }
    ts.sort((x, y) => x - y);
    ms = ts[Math.min(ts.length - 1, Math.ceil(ts.length * 0.95) - 1)];
  }
  rows.push({ ms, sql: k, plan });
  const allowed = ALLOWED.find(([re]) => re.test(k));
  if (scans.length && !allowed) {
    flagged++;
    console.log(`\nFULL SCAN  p95=${ms.toFixed(2)}ms\n  ${k.slice(0, 220)}\n  ${plan.join("\n  ")}`);
  }
}
const only = process.argv.includes("--plans") ? process.argv[process.argv.indexOf("--plans") + 1] : "";
if (only) for (const r of rows.filter((x) => x.sql.includes(only))) console.log(`\n${r.ms.toFixed(2)} ms  ${r.sql.slice(0, 260)}\n  ${r.plan.join("\n  ")}`);
rows.sort((a, b) => b.ms - a.ms);
console.log(`\n${seen.size} distinct statements, ${flagged} with full scans of large tables`);
console.log("slowest 8 (scratch SQLite, in-process):");
for (const r of rows.slice(0, 8)) console.log(`  ${r.ms.toFixed(2)} ms  ${r.sql.slice(0, 110)}`);
d.close();
rmSync(dir, { recursive: true, force: true });
process.exitCode = flagged ? 1 : 0;
