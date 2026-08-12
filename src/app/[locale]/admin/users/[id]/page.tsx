import { getTranslations } from "next-intl/server";
import AdminShell from "@/components/layout/AdminShell";

// /admin/users/[id] — 占位页（任务 8 实现详情岛后替换 children 为真 island）。
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  return (
    <AdminShell pageTitle={t("users.detail.title")}>
      <div className="text-dr-mid text-sm">TODO: user detail island ({id})</div>
    </AdminShell>
  );
}
