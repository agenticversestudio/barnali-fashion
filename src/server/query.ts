import { fail } from "./http";
import { isValidDate } from "./validate";

export const params = (req: Request) => new URL(req.url).searchParams;

export function qStr(p: URLSearchParams, k: string, max = 100): string | undefined {
  const v = p.get(k)?.trim();
  if (!v) return undefined;
  if (v.length > max) fail("VALIDATION", `${k}: too long`, { field: k });
  return v;
}
export function qDate(p: URLSearchParams, k: string): string | undefined {
  const v = qStr(p, k, 10);
  if (v !== undefined && !isValidDate(v)) fail("VALIDATION", `${k}: must be YYYY-MM-DD`, { field: k });
  return v;
}
export function qEnum<T extends string>(p: URLSearchParams, k: string, allowed: readonly T[]): T | undefined {
  const v = qStr(p, k);
  if (v === undefined) return undefined;
  if (!(allowed as readonly string[]).includes(v)) fail("VALIDATION", `${k}: must be one of ${allowed.join(", ")}`, { field: k });
  return v as T;
}
export function qLimit(p: URLSearchParams, def = 50, max = 200): number {
  const v = p.get("limit");
  if (!v) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) return fail("VALIDATION", "limit: must be a positive whole number", { field: "limit" });
  return Math.min(n, max);
}

/** Escape LIKE wildcards; use with `ESCAPE '!'`. */
export const likeArg = (s: string) => `%${s.replace(/[!%_]/g, (c) => `!${c}`)}%`;
