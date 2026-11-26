import { createClient, type Client, type Transaction } from "@tursodatabase/serverless/compat";

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
