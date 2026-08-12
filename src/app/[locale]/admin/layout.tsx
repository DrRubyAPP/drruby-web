import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { homeHrefForRole } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/session";

/**
 * Admin Console 细粒度 role 守卫：要求 `role === "admin"`，覆盖 /admin/users 等全部子页。
 * middleware（`proxy.ts`）已粗粒度拦截未登录（PROTECTED 含 "/admin"）；此处兜底：
 * - 未登录 → 回登录页（防误配跳转成环）；
 * - role 不符 → 跳其角色对应落点 `homeHrefForRole`。
 *
 * 用 `getServerSession()` 读会话，使该子树转为动态渲染（可接受）。
 */
export default async function AdminLayout({
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
  if (role !== "admin") {
    redirect({ href: homeHrefForRole(role), locale });
  }
  return <>{children}</>;
}
