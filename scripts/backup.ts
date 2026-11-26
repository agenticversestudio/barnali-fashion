// Usage: node --env-file=.env.local scripts/backup.ts [--out backups] [--keep 12] [--r2] [--sqlite scratch.db]
// Writes <out>/barnali-YYYYMMDD-HHMMSS.json.gz (every table except sessions, with a checksum). Read-only on the database.
// Backups contain customer phones/addresses and password hashes: keep them private (the backups/ folder is git-ignored).
import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { dump } from "./lib/backup-core.ts";
import { openTarget } from "./lib/target.ts";

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const outDir = arg("--out") ?? "backups";
const keep = arg("--keep") ? Number(arg("--keep")) : 0;
if (arg("--keep") && (!Number.isInteger(keep) || keep < 1)) throw new Error("--keep must be a positive integer");

const conn = openTarget(argv);
const b = await dump(conn);
conn.close();

mkdirSync(outDir, { recursive: true });
const stamp = b.meta.createdAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "").replace("T", "-");
const file = join(outDir, `barnali-${stamp}.json.gz`);
writeFileSync(file, gzipSync(JSON.stringify(b)));

const total = Object.values(b.meta.counts).reduce((s, n) => s + n, 0);
console.log(`backup ${file}  ${Math.round(statSync(file).size / 1024)} KB, ${total} rows`);
console.log(Object.entries(b.meta.counts).map(([t, n]) => `  ${t.padEnd(14)} ${n}`).join("\n"));

if (argv.includes("--r2")) {
  // Off-site copy to the private R2 bucket under backups/ (needs the same R2_* env vars as photo storage).
  const { R2_ACCOUNT_ID: acct, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket } = process.env;
  if (!acct || !id || !secret || !bucket) throw new Error("--r2 needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET");
  const { AwsClient } = await import("aws4fetch");
  const aws = new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: "s3", region: "auto" });
  const key = `backups/${file.split(/[\\/]/).pop()}`;
  const res = await aws.fetch(`https://${acct}.r2.cloudflarestorage.com/${bucket}/${key}`, { method: "PUT", body: readFileSync(file), headers: { "Content-Type": "application/gzip" } });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status})`);
  console.log(`uploaded r2://${bucket}/${key}`);
}

if (keep) {
  const old = readdirSync(outDir).filter((f) => /^barnali-\d{8}-\d{6}\.json\.gz$/.test(f)).sort().reverse().slice(keep);
  for (const f of old) {
    unlinkSync(join(outDir, f));
    console.log(`pruned ${f}`);
  }
}
