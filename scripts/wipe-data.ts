// Usage: node --env-file=.env.local scripts/wipe-data.ts --yes-wipe [--booking-start 0] [--sqlite scratch.db]
// Go-live reset (T9.1): removes ALL business data (garments, customers, bookings, payments, care, photos rows, expenses, cash closings,
// audit + sync logs) so demo/test data never reaches production. KEEPS users, settings and sessions. Resets the id counters
// (first booking becomes BF-BK-<year>-<start+1>; default start 0 -> -001).
// A full backup is written to backups/ BEFORE anything is deleted. Photos already uploaded to R2 are NOT deleted (delete them in the Cloudflare dashboard).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { TABLE_ORDER, dump } from "./lib/backup-core.ts";
import { openTarget, type Stmt } from "./lib/target.ts";

const argv = process.argv.slice(2);
if (!argv.includes("--yes-wipe")) {
  console.error("Refusing to run: this deletes all garments, customers and bookings.\nRe-run with --yes-wipe if you are sure. A backup is taken first.");
  process.exit(2);
}
const startArg = argv.includes("--booking-start") ? Number(argv[argv.indexOf("--booking-start") + 1]) : 0;
if (!Number.isInteger(startArg) || startArg < 0) throw new Error("--booking-start must be a whole number >= 0");

const conn = openTarget(argv);
try {
  const b = await dump(conn);
  mkdirSync("backups", { recursive: true });
  const file = join("backups", `pre-wipe-${b.meta.createdAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "").replace("T", "-")}.json.gz`);
  writeFileSync(file, gzipSync(JSON.stringify(b)));
  console.log(`backup written: ${file}`);

  const keep = new Set(["users", "settings", "counters"]);
  const year = new Date().getFullYear();
  const stmts: Stmt[] = [
    ...[...TABLE_ORDER].reverse().filter((t) => !keep.has(t)).map((t): Stmt => ({ sql: `DELETE FROM "${t}"` })),
    { sql: "DELETE FROM counters WHERE name <> 'user'" },
    ...[[`booking-${year}`, startArg], ["care", 0], ["expense", 0], ["customer", 0]].map(([name, value]): Stmt => ({ sql: "INSERT INTO counters(name,value) VALUES (?,?)", args: [name as string, value as number] })),
  ];
  await conn.run(stmts);

  for (const t of TABLE_ORDER) {
    const n = Number((await conn.query(`SELECT COUNT(*) AS n FROM "${t}"`))[0].n);
    console.log(`  ${t.padEnd(14)} ${String(n).padStart(5)}${keep.has(t) ? "  (kept)" : ""}`);
  }
  console.log(`done. First booking will be BF-BK-${year}-${String(startArg + 1).padStart(3, "0")}. To undo: restore.ts ${file} --force`);
} finally {
  conn.close();
}
