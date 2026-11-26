import type { Exec } from "./db";

/** Atomically bump a named counter and return the new value. Run inside the caller's transaction. */
export async function nextCounter(x: Exec, name: string): Promise<number> {
  const r = await x.execute({
    sql: "INSERT INTO counters(name,value) VALUES (?,1) ON CONFLICT(name) DO UPDATE SET value = value + 1 RETURNING value",
    args: [name],
  });
  return Number(r.rows[0].value);
}

export const pad = (n: number, width: number) => String(n).padStart(width, "0");

/** IST calendar date "YYYY-MM-DD" for now (or for a given instant). */
export function todayIST(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return ist.toISOString().slice(0, 10);
}
