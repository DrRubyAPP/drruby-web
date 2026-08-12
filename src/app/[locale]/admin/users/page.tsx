import { getTranslations } from "next-intl/server";
import AdminShell from "@/components/layout/AdminShell";
import UsersListIsland from "@/components/sections/admin/users/users-list";

// /admin/users — 用户列表页（服务端壳 + 客户端岛）。
// layout 已守卫 role==="admin"。
export default async function AdminUsersPage() {
  const t = await getTranslations("admin");
  return (
    <AdminShell pageTitle={t("users.title")} pageSub={t("users.subtitle")}>
      <UsersListIsland />
    </AdminShell>
  );
}
