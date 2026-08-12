import type { ReactNode } from "react";
import { UnauthorizedRedirect } from "@/components/api";
import { redirect } from "@/i18n/navigation";
import { homeHrefForRole } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/session";

/**
 * 消费者门户细粒度 role 守卫：要求 `role ∈ {user, admin}`。middleware（`proxy.ts`）
 * 已粗粒度拦截未登录；此处兜底：
 * - 未登录 → 回登录页（防 `homeHrefForRole(null)==="/portal"` 自跳成环）；
 * - clinic/collaborator → 跳其角色对应落点。
 *
 * admin 也是一般用户，可进入消费者门户（其「管理后台」入口由 UserMenu 单独渲染）。
 *
 * 用 `getServerSession()` 读会话，使该子树转为动态渲染（可接受）。
 */
export default async function PortalLayout({
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
  if (role !== "user" && role !== "admin") {
    redirect({ href: homeHrefForRole(role), locale });
  }
  return (
    <>
      <UnauthorizedRedirect />
      {children}
    </>
  );
}
