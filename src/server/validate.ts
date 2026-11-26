import { fail } from "./http";

type Obj = Record<string, unknown>;
const bad = (k: string, why: string) => fail("VALIDATION", `${k}: ${why}`, { field: k });

export function str(o: Obj, k: string, opt: { min?: number; max?: number; optional?: boolean } = {}): string | undefined {
  const v = o[k];
  if (v === undefined || v === null || v === "") {
    if (opt.optional) return undefined;
    return bad(k, "required");
  }
  if (typeof v !== "string") return bad(k, "must be text");
  const s = v.trim();
  if (s.length < (opt.min ?? 1)) return bad(k, `at least ${opt.min ?? 1} characters`);
  if (s.length > (opt.max ?? 500)) return bad(k, `at most ${opt.max ?? 500} characters`);
  return s;
}
export const req = (o: Obj, k: string, opt: { min?: number; max?: number } = {}): string => str(o, k, opt) as string;

export function int(o: Obj, k: string, opt: { min?: number; max?: number; optional?: boolean } = {}): number | undefined {
  const v = o[k];
  if (v === undefined || v === null) {
    if (opt.optional) return undefined;
    return bad(k, "required");
  }
  if (typeof v !== "number" || !Number.isInteger(v)) return bad(k, "must be a whole number");
  if (v < (opt.min ?? 0)) return bad(k, `must be ≥ ${opt.min ?? 0}`);
  if (opt.max !== undefined && v > opt.max) return bad(k, `must be ≤ ${opt.max}`);
  return v;
}
export const reqInt = (o: Obj, k: string, opt: { min?: number; max?: number } = {}): number => int(o, k, opt) as number;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
export function date(o: Obj, k: string, optional = false): string | undefined {
  const s = str(o, k, { optional, max: 10 });
  if (s === undefined) return undefined;
  if (!isValidDate(s)) return bad(k, "must be a real date YYYY-MM-DD");
  return s;
}
export const reqDate = (o: Obj, k: string): string => date(o, k) as string;

export function oneOf<T extends string>(o: Obj, k: string, allowed: readonly T[], optional = false): T | undefined {
  const v = o[k];
  if (v === undefined || v === null) {
    if (optional) return undefined;
    return bad(k, "required");
  }
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) return bad(k, `must be one of ${allowed.join(", ")}`);
  return v as T;
}
export const reqOneOf = <T extends string>(o: Obj, k: string, allowed: readonly T[]): T => oneOf(o, k, allowed) as T;

export function obj(o: Obj, k: string, optional = false): Obj | undefined {
  const v = o[k];
  if (v === undefined || v === null) {
    if (optional) return undefined;
    return bad(k, "required");
  }
  if (typeof v !== "object" || Array.isArray(v)) return bad(k, "must be an object");
  return v as Obj;
}

export function strArray(o: Obj, k: string, opt: { min?: number; max?: number } = {}): string[] {
  const v = o[k];
  if (!Array.isArray(v)) return bad(k, "must be a list") as never;
  if (v.length < (opt.min ?? 0)) return bad(k, `need at least ${opt.min}`) as never;
  if (v.length > (opt.max ?? 100)) return bad(k, `at most ${opt.max ?? 100}`) as never;
  if (!v.every((x) => typeof x === "string" && x.trim())) return bad(k, "must be a list of text") as never;
  return [...new Set(v.map((x: string) => x.trim()))];
}

export const PAY_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const;

/** Indian mobile: 10 digits (optionally +91/0 prefix, spaces/dashes ignored). Returns the 10 digits. */
export function phone(o: Obj, k: string, optional = false): string | undefined {
  const s = str(o, k, { optional, max: 20 });
  if (s === undefined) return undefined;
  let d = s.replace(/[\s-]/g, "");
  if (d.startsWith("+91")) d = d.slice(3);
  else if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  if (!/^\d{10}$/.test(d)) return bad(k, "must be a 10-digit mobile number");
  return d;
}
