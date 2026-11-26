// Usage: node --env-file=.env.local scripts/restore.ts <backup.json.gz> [--dry-run] [--force] [--sqlite scratch.db]
// Disaster recovery. SAFEST: create a NEW empty Turso database, run `npm run db:migrate` against it, point TURSO_* at it, then restore.
// Refuses a non-empty target unless --force (which wipes all data tables first). Verifies checksum before and row counts after.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { restore, type Backup } from "./lib/backup-core.ts";
import { openTarget } from "./lib/target.ts";

const argv = process.argv.slice(2);
const file = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--sqlite");
if (!file) throw new Error("Usage: restore.ts <backup.json.gz> [--dry-run] [--force] [--sqlite file]");

const backup = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as Backup;
const conn = openTarget(argv);
try {
  const r = await restore(conn, backup, { force: argv.includes("--force"), dryRun: argv.includes("--dry-run") });
  console.log(r.dryRun ? "dry-run OK (nothing written)" : `restore OK${r.wiped ? " (target was wiped first)" : ""}`);
  console.log(`backup taken ${backup.meta.createdAt}`);
  console.log(Object.entries(r.restored).map(([t, n]) => `  ${t.padEnd(14)} ${n}`).join("\n"));
  if (!r.dryRun) console.log("Users must log in again (sessions are not restored). Set SESSION/CRON/R2/Google env vars on the new deployment if the database URL changed.");
} finally {
  conn.close();
}
