import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

// next-intl 本地化路由中间件（处理 locale 前缀的 rewrite/redirect）。
const intlMiddleware = createMiddleware(routing);

// 受保护前缀（去 locale 前缀后匹配）：未登录访问重定向到本地化登录页。
const PROTECTED = ["/portal", "/clinic"];

/** 拆出 locale 前缀：`/zh/portal` → { locale: "zh", rest: "/portal" }。 */
function localeOf(pathname: string): { locale: string; rest: string } {
  for (const l of routing.locales) {
    if (l === routing.defaultLocale) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return { locale: l, rest: pathname.slice(l.length + 1) || "/" };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, rest } = localeOf(pathname);

  const isProtected = PROTECTED.some(
    (p) => rest === p || rest.startsWith(`${p}/`),
  );

  // 乐观校验：仅检查会话 cookie 是否存在（不查库），快速拦截未登录请求；
  // 真正的会话有效性由各受保护页面的服务端校验兜底。
  if (isProtected && !getSessionCookie(request)) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    const url = new URL(`${prefix}/login`, request.url);
    // 保留原始（含前缀）路径以便登录后回跳。
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 其余交给 next-intl 处理本地化路由。
  return intlMiddleware(request);
}

export const config = {
  // 排除 api / api-docs / _next / _vercel 与带扩展名的静态资源。
  matcher: ["/((?!api|api-docs|_next|_vercel|.*\\..*).*)"],
};
