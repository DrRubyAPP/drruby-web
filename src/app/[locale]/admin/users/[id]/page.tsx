import { getTranslations } from "next-intl/server";
import AdminShell from "@/components/layout/AdminShell";
import UserDetailIsland from "@/components/sections/admin/users/user-detail";
import { getServerSession } from "@/lib/auth/session";

// /admin/users/[id] — 用户详情/编辑页（服务端壳 + 客户端岛）。
// layout 已守卫 role==="admin"；此处读 session 拿 currentUserId 注入 island，
// 避免 island 客户端获取 session。
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const session = await getServerSession();
  const currentUserId = session?.user?.id ?? "";
  return (
    <AdminShell pageTitle={t("users.detail.title")}>
      <UserDetailIsland id={id} currentUserId={currentUserId} />
    </AdminShell>
  );
}
