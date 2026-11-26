import { createClient, type Client, type Transaction, type ResultSet, type InStatement } from "@tursodatabase/serverless/compat";

/** Anything that can run SQL: the client or an open transaction. */
export interface Exec {
  execute(stmt: InStatement): Promise<ResultSet>;
}

let client: Client | undefined;

/** Lazily created Turso client (fetch-based: works on Node and on Workers). */
export function db(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set");
    client = createClient({ url: url.replace(/^libsql:\/\//, "https://"), authToken });
  }
  return client;
}

/** Run fn inside a write transaction; commit on success, roll back on throw. */
export async function tx<T>(fn: (t: Transaction) => Promise<T>): Promise<T> {
  const t = await db().transaction("write");
  try {
    const out = await fn(t);
    await t.commit();
    return out;
  } catch (e) {
    try { await t.rollback(); } catch { /* already closed */ }
    throw e;
  } finally {
    t.close();
  }
}

/**
 * Run several independent reads in ONE network round trip (the Turso client serialises separate requests, so
 * Promise.all does not help). Inside a transaction the statements share a connection and run one after another.
 */
export async function readAll(x: Exec, stmts: InStatement[]): Promise<ResultSet[]> {
  if (x === client) return client.batch(stmts, "read");
  const out: ResultSet[] = [];
  for (const s of stmts) out.push(await x.execute(s));
  return out;
}
