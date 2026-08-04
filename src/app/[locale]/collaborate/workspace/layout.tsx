import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { homeHrefForRole } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/session";

/**
 * 科研协作站细粒度 role 守卫：要求 `role === "collaborator"`。仅保护
 * `/collaborate/workspace` 子树（`/collaborate` 营销页公开）。middleware
 * （`proxy.ts`）已粗粒度拦截未登录；此处兜底：
 * - 未登录 → 回登录页；
 * - 其余 role → 跳其角色对应落点 `homeHrefForRole`。
 *
 * 用 `getServerSession()` 读会话，使该子树转为动态渲染（可接受）。
 */
export default async function CollaborateWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    redirect({ href: "/login", locale });
  }
  const role = session?.user ? (session.user as { role?: string }).role : null;
  if (role !== "collaborator") {
    redirect({ href: homeHrefForRole(role), locale });
  }
  return <>{children}</>;
}
