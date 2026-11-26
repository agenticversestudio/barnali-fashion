import { db } from "@/server/db";

export async function GET() {
  try {
    await db().execute("select 1");
    return Response.json({ ok: true, db: "ok" });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
