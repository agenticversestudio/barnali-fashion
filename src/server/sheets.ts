import type { SessionUser, SyncStatus } from "@/types/api";
import { db } from "./db";
import { fail } from "./http";
import { DATASETS, dataset, type Dataset } from "./services/exports";

/**
 * One-way mirror of the database into a Google Sheet (admin's read-only backup / reporting view).
 * Auth: service-account JWT (RS256 via WebCrypto) → OAuth token. Env: GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_SHEET_ID.
 * Each run rewrites every tab completely (clear + write), so the sheet can never drift from the database.
 * Values are written RAW: a cell like "=1+1" stays text and is never evaluated as a formula.
 */
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://sheets.googleapis.com/v4/spreadsheets";
const STALE_RUN_MS = 5 * 60_000;
const KEEP_LOG_ROWS = 200;

type Fetch = typeof fetch;
const b64url = (b: ArrayBuffer | string) =>
  Buffer.from(typeof b === "string" ? b : new Uint8Array(b)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export const sheetsConfigured = () => !!(process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID);

async function accessToken(f: Fetch): Promise<string> {
  const email = process.env.GOOGLE_SA_EMAIL!;
  const pem = process.env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const der = Buffer.from(pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, ""), "base64");
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const iat = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claims}`));
  const res = await f(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claims}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`);
  const j = (await res.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("Google token response had no access_token");
  return j.access_token;
}

async function syncLogDataset(): Promise<Dataset> {
  const r = (await db().execute("SELECT id,trigger,started_at,finished_at,status,tabs,row_count,message FROM sync_log ORDER BY id DESC LIMIT 100")).rows;
  return {
    name: "_SyncLog",
    header: ["id", "trigger", "started_at", "finished_at", "status", "tabs", "rows", "message"],
    rows: r.map((x) => [Number(x.id), String(x.trigger), String(x.started_at), x.finished_at ? String(x.finished_at) : "", String(x.status), Number(x.tabs), Number(x.row_count), x.message ? String(x.message) : ""]),
  };
}

/** Rewrite every tab. Throws on any Google error (caller records it). */
async function writeAll(f: Fetch, tabs: Dataset[]): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const token = await accessToken(f);
  const call = async (url: string, init: RequestInit = {}) => {
    const res = await f(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    if (!res.ok) throw new Error(`Google Sheets API ${res.status} for ${init.method ?? "GET"} ${new URL(url).pathname.split("/").slice(-1)[0]}`);
    return res.json() as Promise<Record<string, unknown>>;
  };
  const base = `${API}/${encodeURIComponent(sheetId)}`;

  const meta = (await call(`${base}?fields=sheets.properties.title`)) as { sheets?: { properties: { title: string } }[] };
  const have = new Set((meta.sheets ?? []).map((s) => s.properties.title));
  const missing = tabs.filter((t) => !have.has(t.name));
  if (missing.length) await call(`${base}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: missing.map((t) => ({ addSheet: { properties: { title: t.name } } })) }) });

  await Promise.all(
    tabs.map(async (t) => {
      const range = encodeURIComponent(`'${t.name}'`);
      await call(`${base}/values/${range}:clear`, { method: "POST", body: "{}" });
      await call(`${base}/values/${encodeURIComponent(`'${t.name}'!A1`)}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ range: `'${t.name}'!A1`, majorDimension: "ROWS", values: [t.header, ...t.rows] }),
      });
    }),
  );
}

export interface SyncResult { ok: true; tabs: number; rows: number; startedAt: string; finishedAt: string }

export async function syncSheets(opts: { trigger: "CRON" | "MANUAL"; user?: SessionUser; fetchImpl?: Fetch }): Promise<SyncResult> {
  if (!sheetsConfigured()) return fail("RULE", "Google Sheets sync is not configured (GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY / GOOGLE_SHEET_ID)");
  const running = (await db().execute({ sql: "SELECT 1 FROM sync_log WHERE status='RUNNING' AND started_at > ?", args: [new Date(Date.now() - STALE_RUN_MS).toISOString()] })).rows[0];
  if (running) return fail("RULE", "A sync is already running. Try again in a minute.");

  const ins = await db().execute({ sql: "INSERT INTO sync_log(trigger,triggered_by) VALUES (?,?)", args: [opts.trigger, opts.user?.id ?? null] });
  const logId = Number(ins.lastInsertRowid);
  const finish = async (status: "OK" | "FAILED", tabs: number, rows: number, message?: string) => {
    await db().execute({ sql: "UPDATE sync_log SET status=?, finished_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'), tabs=?, row_count=?, message=? WHERE id=?", args: [status, tabs, rows, message ?? null, logId] });
    await db().execute({ sql: "DELETE FROM sync_log WHERE id <= ?", args: [logId - KEEP_LOG_ROWS] });
  };
  try {
    const data = await Promise.all(DATASETS.map((d) => dataset(d)));
    const rows = data.reduce((s, d) => s + d.rows.length, 0);
    // _SyncLog tab shows history including this (still RUNNING) run, which is accurate and useful when debugging
    await writeAll(opts.fetchImpl ?? fetch, [...data, await syncLogDataset()]);
    await finish("OK", data.length + 1, rows);
    const r = (await db().execute({ sql: "SELECT started_at, finished_at FROM sync_log WHERE id=?", args: [logId] })).rows[0];
    return { ok: true, tabs: data.length + 1, rows, startedAt: String(r.started_at), finishedAt: String(r.finished_at) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    await finish("FAILED", 0, 0, msg.slice(0, 300));
    return fail("INTERNAL", `Sheets sync failed: ${msg}`.slice(0, 300));
  }
}

export async function syncStatus(): Promise<SyncStatus> {
  const r = (await db().execute("SELECT status, finished_at, message FROM sync_log WHERE status <> 'RUNNING' ORDER BY id DESC LIMIT 1")).rows[0];
  const s: SyncStatus = { configured: sheetsConfigured() };
  if (r) {
    s.lastSyncAt = String(r.finished_at);
    s.lastStatus = r.status as "OK" | "FAILED";
    if (r.message) s.lastMessage = String(r.message);
  }
  return s;
}
