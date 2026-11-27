/** Client-side date helpers for display logic only (no API / business rules). */

/** Local calendar date as YYYY-MM-DD (not UTC, so India evenings do not roll to tomorrow). */
export function localISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from `fromISO` to `toISO` (positive = toISO is in the future). */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n);
  return localISO(d);
}

/** "in 3 days", "today", "2 days ago" */
export function relativeDays(fromISO: string, toISO: string): string {
  const n = daysBetween(fromISO, toISO);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** Digits-only wa.me / tel helpers. 10-digit Indian numbers get the 91 prefix. */
export function waLink(phone: string, text?: string): string {
  const d = phone.replace(/\D/g, "");
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
