import type { SessionUser, SettingsDto } from "@/types/api";
import { audit } from "../audit";
import { db, tx } from "../db";
import { fail } from "../http";
import { reqInt, str } from "../validate";
import { BUFFER_DAYS } from "./garments";

const DEFAULTS = { late_fee_percent: "15", shop_name: "Barnali Fashion", shop_address: "", shop_phone: "", default_care_vendor: "" };

function toDto(m: Map<string, string>): SettingsDto {
  const get = (k: keyof typeof DEFAULTS) => m.get(k) ?? DEFAULTS[k];
  return {
    lateFeePercent: Number(get("late_fee_percent")),
    bufferDays: BUFFER_DAYS, // fixed: the double-booking trigger in the database uses the same value
    shopName: get("shop_name"),
    shopAddress: get("shop_address"),
    shopPhone: get("shop_phone"),
    defaultCareVendor: get("default_care_vendor"),
  };
}

const load = async (): Promise<Map<string, string>> =>
  new Map((await db().execute("SELECT key, value FROM settings")).rows.map((r) => [String(r.key), String(r.value)]));

/** Readable by staff and admin: nothing in here is secret, and the UI needs shop details for receipts / WhatsApp text. */
export async function getSettings(): Promise<SettingsDto> {
  return toDto(await load());
}

/** Admin only. Every change is audited (the late-fee percentage changes what customers are charged). */
export async function updateSettings(admin: SessionUser, b: Record<string, unknown>): Promise<SettingsDto> {
  const allowed = ["lateFeePercent", "shopName", "shopAddress", "shopPhone", "defaultCareVendor"];
  const unknown = Object.keys(b).filter((k) => !allowed.includes(k));
  if (unknown.length) fail("VALIDATION", `Unknown or read-only setting: ${unknown.join(", ")}`, { fields: unknown });
  if (!Object.keys(b).length) fail("VALIDATION", "Nothing to update");

  const next: Record<string, string> = {};
  if (b.lateFeePercent !== undefined) next.late_fee_percent = String(reqInt(b, "lateFeePercent", { min: 0, max: 100 }));
  const text = (f: string, key: string, max: number, required = false) => {
    if (b[f] === undefined) return;
    const v = str(b, f, { max, optional: !required }) ?? "";
    if (required && !v) fail("VALIDATION", `${f}: required`, { field: f });
    next[key] = v;
  };
  text("shopName", "shop_name", 80, true);
  text("shopAddress", "shop_address", 200);
  text("shopPhone", "shop_phone", 20);
  text("defaultCareVendor", "default_care_vendor", 80);

  return tx(async (x) => {
    const before = new Map((await x.execute("SELECT key, value FROM settings")).rows.map((r) => [String(r.key), String(r.value)]));
    const changed: Record<string, { from: string | undefined; to: string }> = {};
    for (const [k, v] of Object.entries(next)) {
      if (before.get(k) === v) continue;
      await x.execute({ sql: "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", args: [k, v] });
      changed[k] = { from: before.get(k), to: v };
      before.set(k, v);
    }
    if (Object.keys(changed).length) await audit(x, admin.id, "settings.edit", "settings", "shop", Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.from])), Object.fromEntries(Object.entries(changed).map(([k, v]) => [k, v.to])));
    return toDto(before);
  });
}
