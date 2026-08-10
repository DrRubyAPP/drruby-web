import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { AppError } from "@/lib/errors";

/**
 * 服务端读取当前会话（含 user.role 等 additionalFields）——**cookie + bearer 双通道**。
 *
 * 在 Server Component 中调用会使该页面转为动态渲染——用于需要感知登录态的
 * 导航栏 / 页面 layout 守卫等场景。未登录返回 null。
 *
 * 此函数保留 cookie 通道：页面 SSR 守卫（portal / clinic / collaborate layout、
 * Navbar）依赖 cookie session 做渲染前的登录/角色判定，不在本次「API 禁 cookie」
 * 收紧范围内。后端数据 API 守卫请改用 `getBearerSession()` / `requireUser()`。
 */
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * 仅从 `Authorization: Bearer <token>` 解析会话——**后端数据 API 鉴权专用通道**。
 *
 * 实现：从请求头取出 `authorization`，构造**只含该头**的新 `Headers` 交给 Better Auth，
 * cookie 头不转发 → `getSession` 不会读到 cookie session，等价于在 API 层禁用 cookie 通道
 * （bearer 插件的 before-hook 会把 Authorization 反解成 session cookie，所以 bearer 仍生效）。
 *
 * 未带 bearer 的请求（无论是否带 cookie）→ `getSession` 返回 null → `requireUser()` 抛 401。
 */
export async function getBearerSession() {
  const incoming = await headers();
  const forward = new Headers();
  const authorization = incoming.get("authorization");
  if (authorization) forward.set("authorization", authorization);
  return auth.api.getSession({ headers: forward });
}

/** 当前登录用户（`getServerSession` 返回的 user 类型）。 */
export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>["user"];

/**
 * route handler 统一鉴权入口：取当前登录用户，未登录抛 401（`AppError`）。
 *
 * **仅认 `Authorization: Bearer <token>` 通道**（见 `getBearerSession()`），
 * 不接受 cookie session——后端数据 API 鉴权禁止走 cookie。配合 `handle()` 包装器，
 * 未登录 / 仅凭 cookie 的请求会得到标准 401 响应体。
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getBearerSession();
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "请先登录", 401);
  }
  // 软删守卫：已注销账号即使持有有效 session/token 也拒鉴权，避免 task-10
  // 软删脱敏后仍能登录。`deletedAt` 经 additionalFields 暴露到 session.user。
  if ((session.user as { deletedAt?: Date | null }).deletedAt) {
    throw new AppError("UNAUTHORIZED", "账号已注销", 401);
  }
  return session.user;
}

/**
 * 在 `requireUser()` 之上校验角色：`user.role ∈ roles` 才放行，否则抛 403
 * （`AppError("FORBIDDEN")`）；未登录仍先走 `requireUser()` 的 401。
 *
 * 配合 `handle()` 包装器，越权请求得到标准 403 响应体（对齐 401/404 语义）。
 * 供 SP7 诊所门户 / 科研协作站的服务端 RBAC 复用。
 */
export async function requireRole(
  ...roles: readonly string[]
): Promise<SessionUser> {
  const user = await requireUser();
  const role = (user as { role?: string }).role;
  if (!role || !roles.includes(role)) {
    throw new AppError("FORBIDDEN", "无权访问", 403);
  }
  return user;
}

export { homeHrefForRole } from "@/lib/auth/roles";
