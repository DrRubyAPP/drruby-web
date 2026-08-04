import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { AppError } from "@/lib/errors";

/**
 * 服务端读取当前会话（含 user.role 等 additionalFields）。
 *
 * 在 Server Component 中调用会使该页面转为动态渲染——用于需要感知登录态的
 * 导航栏等场景。未登录返回 null。
 *
 * 认证来源由 auth 插件决定：cookie session 与（bearer 插件）
 * `Authorization: Bearer <token>` 两种来源均可解析出 user。
 */
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** 当前登录用户（`getServerSession` 返回的 user 类型）。 */
export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>["user"];

/**
 * route handler 统一鉴权入口：取当前登录用户，未登录抛 401（`AppError`）。
 *
 * 认 cookie session 与 `Authorization: Bearer <token>` 两种来源。配合
 * `handle()` 包装器，未登录请求会得到标准 401 响应体。
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession();
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
