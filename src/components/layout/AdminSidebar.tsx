"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Admin Console sidebar（参考 ClinicSidebar，浅色 #F2F0EE 变体）。
// 首期仅一项「用户管理」→ /admin/users；后续模块（内容/数据/运营）按需扩展。
const NAV_ITEMS: { href: string; labelKey: string }[] = [
  { href: "/admin/users", labelKey: "sidebar.usersManagement" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className="bg-[#F2F0EE] w-[220px] flex-shrink-0 flex flex-col h-full border-r border-dr-border">
      {/* Logo / admin header */}
      <div className="px-6 pt-7 pb-5 border-b border-dr-border">
        <Link
          href="/"
          className="font-serif text-[18px] text-dr-ink no-underline leading-none"
        >
          Dr<span className="text-dr-red">Ruby</span>
        </Link>
        <div className="text-[10px] text-dr-mid mt-[3px]">
          {t("sidebar.title")}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-6 text-[11px] no-underline border-l-2 transition-all ${
                isActive
                  ? "text-dr-ink font-medium border-l-dr-red bg-[rgba(200,16,46,0.04)]"
                  : "text-dr-mid border-l-transparent hover:text-dr-ink"
              }`}
              style={{ paddingTop: "9px", paddingBottom: "9px" }}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block sticky top-0 h-screen self-start">
        {sidebar}
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-dr-red text-white shadow-lg flex items-center justify-center"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-dr-ink/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setMobileOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full">{sidebar}</div>
        </div>
      )}
    </>
  );
}
