import { assertSameOrigin, clearCookie, logout, readCookie } from "@/server/auth";
import { json, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  await logout(readCookie(req));
  return json({ ok: true }, { headers: { "Set-Cookie": clearCookie() } });
});
