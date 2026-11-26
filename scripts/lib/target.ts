// A tiny connection abstraction so the same backup/restore/import code runs against Turso (real) or a local SQLite file (scratch).
import { createClient } from "@tursodatabase/serverless/compat";
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitSql } from "./sql.ts";

export type SqlValue = string | number | null;
export interface Stmt {
  sql: string;
  args?: SqlValue[];
}
export interface Conn {
  kind: "turso" | "sqlite";
  query(sql: string, args?: SqlValue[]): Promise<Record<string, unknown>[]>;
  /** Run statements atomically (one transaction). */
  run(stmts: Stmt[]): Promise<void>;
  close(): void;
}

const plain = (v: unknown) => (typeof v === "bigint" ? Number(v) : v);

export function tursoConn(url: string, authToken: string): Conn {
  const c = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });
  return {
    kind: "turso",
    async query(sql, args = []) {
      const r = await c.execute({ sql, args });
      // read by POSITION: a column named "length" would otherwise return the row's own .length (its column count) and silently corrupt backups
      return r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, plain((row as unknown as unknown[])[i])])));
    },
    async run(stmts) {
      if (stmts.length) await c.batch(stmts.map((s) => ({ sql: s.sql, args: s.args ?? [] })), "write");
    },
    close() {},
  };
}

export function sqliteConn(file: string): Conn {
  const d = new DatabaseSync(file);
  d.exec("PRAGMA foreign_keys = ON");
  return {
    kind: "sqlite",
    async query(sql, args = []) {
      return (d.prepare(sql).all(...args) as Record<string, unknown>[]).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, plain(v)])));
    },
    async run(stmts) {
      d.exec("BEGIN");
      try {
        for (const s of stmts) d.prepare(s.sql).run(...(s.args ?? []));
        d.exec("COMMIT");
      } catch (e) {
        d.exec("ROLLBACK");
        throw e;
      }
    },
    close: () => d.close(),
  };
}

/** `--sqlite <file>` → scratch SQLite file; otherwise Turso from TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. */
export function openTarget(argv: string[]): Conn {
  const i = argv.indexOf("--sqlite");
  if (i >= 0) return sqliteConn(argv[i + 1]);
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set (or pass --sqlite <file>)");
  return tursoConn(url, token);
}

/** Apply db/migrations to a connection (prepares scratch DBs; real DBs use scripts/migrate.ts). */
export async function applyMigrations(c: Conn, dir = join(process.cwd(), "db", "migrations")): Promise<string[]> {
  await c.run([{ sql: "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))" }]);
  const done = new Set((await c.query("SELECT name FROM _migrations")).map((r) => String(r.name)));
  const applied: string[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    await c.run([...splitSql(readFileSync(join(dir, f), "utf8")).map((sql) => ({ sql })), { sql: "INSERT INTO _migrations(name) VALUES (?)", args: [f] }]);
    applied.push(f);
  }
  return applied;
}
