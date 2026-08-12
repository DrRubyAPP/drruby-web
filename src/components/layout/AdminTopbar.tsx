"use client";

import { useTranslations } from "next-intl";
import LogoutButton from "@/components/auth/LogoutButton";

interface AdminTopbarProps {
  pageTitle: string;
  pageSub?: string;
}

// Admin Console topbar（参考 ClinicTopbar，简化版）：
// 左侧 pageTitle + pageSub，右侧 LogoutButton（不挂 UserMenu，admin 后台无用户首页概念）。
export default function AdminTopbar({ pageTitle, pageSub }: AdminTopbarProps) {
  const t = useTranslations("admin");
  const sub = pageSub ?? t("sidebar.title");
  return (
    <div className="bg-dr-white px-5 md:px-7 h-[52px] flex items-center justify-between border-b border-dr-border sticky top-0 z-10">
      <div>
        <div className="font-serif text-[17px] text-dr-ink leading-none">
          {pageTitle}
        </div>
        <div className="text-[8px] font-semibold tracking-[0.18em] uppercase text-dr-red mt-[3px]">
          {sub}
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
