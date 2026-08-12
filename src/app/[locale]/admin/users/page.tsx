import { getTranslations } from "next-intl/server";
import AdminShell from "@/components/layout/AdminShell";

// /admin/users — 占位页（任务 7 实现列表岛后替换 children 为真 island）。
export default async function AdminUsersPage() {
  const t = await getTranslations("admin");
  return (
    <AdminShell pageTitle={t("users.title")} pageSub={t("users.subtitle")}>
      <div className="text-dr-mid text-sm">TODO: users list island</div>
    </AdminShell>
  );
}
