import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

/**
 * 服务端读取当前会话（含 user.role 等 additionalFields）。
 *
 * 在 Server Component 中调用会使该页面转为动态渲染——用于需要感知登录态的
 * 导航栏等场景。未登录返回 null。
 */
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export { homeHrefForRole } from "@/lib/auth/roles";
