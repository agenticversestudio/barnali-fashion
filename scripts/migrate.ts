// Usage: node --env-file=.env.local scripts/migrate.ts
// Applies db/migrations/*.sql in name order. Each file runs in one atomic batch.
import { createClient } from "@tursodatabase/serverless/compat";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitSql as split } from "./lib/sql.ts";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set");
const db = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });

await db.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))");
const done = new Set((await db.execute("SELECT name FROM _migrations")).rows.map((r) => String(r.name)));
const dir = join(process.cwd(), "db", "migrations");
let applied = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) { console.log(`skip   ${f}`); continue; }
  const stmts = split(readFileSync(join(dir, f), "utf8"));
  await db.batch([...stmts, { sql: "INSERT INTO _migrations(name) VALUES (?)", args: [f] }], "write");
  console.log(`apply  ${f} (${stmts.length} statements)`);
  applied++;
}
console.log(applied ? "done" : "nothing to do");
