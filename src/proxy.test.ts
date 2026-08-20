import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// getSessionCookie 控制登录态：null=未登录（仅检查 cookie 存在性，不查库）。
const mockGetSessionCookie = vi.fn<(req: unknown) => string | null>();
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: (req: unknown) => mockGetSessionCookie(req),
}));

// next-intl 中间件替身：放行分支会走到它，用哨兵头标记「已交给本地化路由」。
vi.mock("next-intl/middleware", () => ({
  default: () => () =>
    new Response(null, { status: 200, headers: { "x-intl": "1" } }),
}));

const { proxy } = await import("@/proxy");

function req(path: string): NextRequest {
  return new NextRequest(new URL(`https://app.test${path}`));
}

const passedToIntl = (res: Response) => res.headers.get("x-intl") === "1";
const locationOf = (res: Response) => res.headers.get("location");

describe("proxy middleware", () => {
  beforeEach(() => {
    mockGetSessionCookie.mockReset();
  });

  describe("未登录访问受保护前缀 → 重定向登录页", () => {
    beforeEach(() => mockGetSessionCookie.mockReturnValue(null));

    it.each([
      "/portal",
      // skin/healthspan 已从公开营销页迁入 portal，现属受保护前缀。
      "/portal/skin",
      "/portal/healthspan",
      "/clinic",
      "/collaborate/workspace",
    ])("%s 无 cookie → 重定向 /login 并带 redirect 回跳", (path) => {
      const res = proxy(req(path));
      expect(passedToIntl(res)).toBe(false);
      const loc = locationOf(res);
      expect(loc).toBeTruthy();
      const url = new URL(loc as string);
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("redirect")).toBe(path);
    });

    it("受保护子路径（/clinic/finance）同样被拦截", () => {
      const res = proxy(req("/clinic/finance"));
      const url = new URL(locationOf(res) as string);
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("redirect")).toBe("/clinic/finance");
    });

    it("zh 前缀保留 locale：/zh/collaborate/workspace → /zh/login", () => {
      const res = proxy(req("/zh/collaborate/workspace"));
      const url = new URL(locationOf(res) as string);
      expect(url.pathname).toBe("/zh/login");
      expect(url.searchParams.get("redirect")).toBe(
        "/zh/collaborate/workspace",
      );
    });
  });

  describe("放行（交给 next-intl 本地化路由）", () => {
    it("公开路径（/waitlist）未登录也放行", () => {
      mockGetSessionCookie.mockReturnValue(null);
      expect(passedToIntl(proxy(req("/waitlist")))).toBe(true);
    });

    it("/collaborate 营销页（非 workspace 子树）未登录放行", () => {
      mockGetSessionCookie.mockReturnValue(null);
      expect(passedToIntl(proxy(req("/collaborate")))).toBe(true);
    });

    it("已登录访问受保护前缀 → 放行", () => {
      mockGetSessionCookie.mockReturnValue("session-token");
      expect(passedToIntl(proxy(req("/collaborate/workspace")))).toBe(true);
    });
  });
});
