"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PORTAL_NAV, PORTAL_USER } from "@/config/user-portal-mock";

// Sidebar nav labels are driven by i18n keys; the mock provides href/icon/badge.
const NAV_LABEL_KEY: Record<string, string> = {
  Dashboard: "nav.dashboard",
  "Skin Analysis": "nav.skinAnalysis",
  Healthspan: "nav.healthspan",
  "My Health Profile": "nav.healthProfile",
  "AI Reports": "nav.aiReports",
  "Personal Coach": "nav.personalCoach",
  "Book a Clinic": "nav.bookClinic",
  "Products & Plans": "nav.products",
  Appointments: "nav.appointments",
};

const SECTION_KEY: Record<string, string> = {
  "My Health": "nav.myHealth",
  "AI Tools": "nav.aiTools",
  Care: "nav.care",
};

export default function PortalSidebar() {
  const pathname = usePathname();
  const t = useTranslations("portal");
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className="bg-dr-ink w-[220px] flex-shrink-0 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-white/6">
        <Link
          href="/"
          className="font-serif text-[19px] text-white no-underline leading-none"
        >
          Dr<span className="text-dr-red">Ruby</span>
        </Link>
        <div className="text-[8px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.4)] mt-[3px]">
          {t("brandSub")}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {PORTAL_NAV.map((section) => (
          <div key={section.label}>
            <div className="text-[8px] font-semibold tracking-[0.22em] uppercase text-white/15 px-6 pt-2.5 pb-1">
              {SECTION_KEY[section.label] ? t(SECTION_KEY[section.label]) : section.label}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);
              const labelKey = NAV_LABEL_KEY[item.label];
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-6 py-2.25 text-[13px] no-underline border-l-2 transition-all ${
                    isActive
                      ? "text-white font-bold border-l-dr-red bg-[rgba(200,16,46,0.07)]"
                      : "text-white/35 border-l-transparent hover:text-white/70"
                  }`}
                  style={{ paddingTop: "9px", paddingBottom: "9px" }}
                >
                  <span className="text-[13px] w-3.5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span>{labelKey ? t(labelKey) : item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[8px] font-bold bg-dr-red text-white px-[5px] py-px rounded-[2px]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-6 py-4 border-t border-white/6 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-[rgba(200,16,46,0.2)] flex items-center justify-center text-[12px] text-white font-medium float-left mr-2.5">
          {PORTAL_USER.initials}
        </div>
        <div className="overflow-hidden">
          <div className="text-[11px] text-white/65 leading-[1.2]">
            {PORTAL_USER.fullName}
          </div>
          <div className="text-[9px] text-white/20 truncate">
            {PORTAL_USER.email}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block sticky top-0 h-screen self-start">{sidebar}</div>

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
