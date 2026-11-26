import { timingSafeEqual } from "node:crypto";
import { fail, json, route } from "@/server/http";
import { syncSheets } from "@/server/sheets";

export const maxDuration = 60;

/** Called by the scheduler (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`). No session; unset secret = always 401. */
export const GET = route(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const ok = !!secret && secret.length >= 16 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) fail("UNAUTHENTICATED", "Invalid cron credentials");
  return json(await syncSheets({ trigger: "CRON" }));
});