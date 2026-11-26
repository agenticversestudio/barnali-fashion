import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic page gate (Next 16 `proxy`, formerly middleware): no session cookie → /erp/login.
 * NOT the security boundary — every API route verifies the session itself (requireUser).
 * Off by default so the prototype screens (localStorage login) keep working until Phase 6 swaps in the real login.
 * Turn on with ERP_AUTH_GUARD=1 (set in Vercel env at T6.2).
 */
export function proxy(request: NextRequest) {
  if (process.env.ERP_AUTH_GUARD !== "1") return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === "/erp/login") return NextResponse.next();
  if (request.cookies.has("bf_session")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/erp/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/erp/:path*"] };
