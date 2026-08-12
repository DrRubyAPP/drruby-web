import { redirect } from "next/navigation";

// /admin → 重定向到 /admin/users（首期唯一模块）。
// 用 next/navigation（非 next-intl redirect）：admin 后台 i18n 内容与 locale 无关，
// 跳 /admin/users（无 locale 前缀，由 middleware 按 as-needed 处理默认 en）。
export default function AdminPage() {
  redirect("/admin/users");
}
