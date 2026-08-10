/**
 * Web 端 bearer token 存储（同源 localStorage）。
 *
 * 背景：后端数据 API 已收紧为**仅认 `Authorization: Bearer <token>`、禁 cookie**
 * （见 `src/lib/auth/session.ts` 的 `getBearerSession()` / `requireUser()`）。
 * Web 前端因此必须在调用 `/api/*` 时显式附带 bearer token——它从登录响应头
 * `set-auth-token` 取得，或从 `/api/auth/token` 由 cookie session 换发（Google
 * 登录回跳 / 页面刷新场景）。
 *
 * 安全权衡：token 存于可读存储（localStorage）意味着 XSS 可窃取。相对 httpOnly
 * cookie 安全性下降，但这是「API 禁 cookie」决策的固有取舍（RN 端存 SecureStore）。
 * 站点应已具备严格 CSP / 输出转义以收敛 XSS 面。token 与服务端 session 同生命周期，
 * 过期 / 软删 / 登出统一由 401 重登闭环处理（见 `fetchJson` 清 token）。
 */

const STORAGE_KEY = "dr-bearer-token";

/** 读取已存 bearer token（SSR / 无 window 时返回 null）。 */
export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

/** 存入 bearer token（登录成功 / token 换发成功后调用）。 */
export function setBearerToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, token);
}

/** 清除 bearer token（登出 / 收到 401 时调用）。 */
export function clearBearerToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
