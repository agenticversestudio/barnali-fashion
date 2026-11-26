import { assertSameOrigin, login, sessionCookie } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { req as reqStr } from "@/server/validate";
import type { LoginResponse } from "@/types/api";

export const POST = route(async (req: Request) => {
  assertSameOrigin(req);
  const body = await readJson(req);
  const { user, token } = await login(
    reqStr(body, "username", { max: 60 }).toLowerCase(),
    reqStr(body, "password", { max: 200 }),
    req.headers.get("user-agent"),
  );
  const res: LoginResponse = { user };
  return json(res, { headers: { "Set-Cookie": sessionCookie(token, user.role) } });
});
