// Enabled only with SQL_CAPTURE=<file>: logs every statement the app runs (sql + args) as JSON lines, for the query-plan audit (T8.3).
import { appendFileSync } from "node:fs";
import { createClient } from "@tursodatabase/serverless/compat";

const out = process.env.SQL_CAPTURE;
if (out) {
  const log = (stmt: unknown) => {
    const s = typeof stmt === "string" ? { sql: stmt, args: [] } : (stmt as { sql: string; args?: unknown[] });
    if (/^\s*(SELECT|WITH|UPDATE|DELETE|INSERT)/i.test(s.sql)) appendFileSync(out, JSON.stringify({ sql: s.sql, args: s.args ?? [] }) + "\n");
  };
  const proto = Object.getPrototypeOf(createClient({ url: "https://capture.invalid", authToken: "x" })) as Record<string, (...a: unknown[]) => unknown>;
  const exec = proto.execute;
  proto.execute = function (this: unknown, stmt: unknown) {
    log(stmt);
    return exec.call(this, stmt);
  };
  const begin = proto.transaction;
  proto.transaction = async function (this: unknown, ...a: unknown[]) {
    const t = (await begin.apply(this, a)) as { execute: (s: unknown) => unknown };
    const te = t.execute.bind(t);
    t.execute = (s: unknown) => (log(s), te(s));
    return t;
  };
}
