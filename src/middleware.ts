import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// 受保护前缀：未登录访问时重定向到登录页（带 redirect 回跳）。
const PROTECTED = ["/portal", "/clinic"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 乐观校验：仅检查会话 cookie 是否存在（不查库），快速拦截未登录请求；
  // 真正的会话有效性由各受保护页面/接口的服务端校验兜底。
  const session = getSessionCookie(request);
  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/clinic/:path*"],
};
