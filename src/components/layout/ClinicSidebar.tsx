"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CLINIC_NAV, CLINIC_PROFILE, CLINIC_USER } from "@/config/clinic-portal-mock";

// Light-sidebar variant for the B2B Clinic Portal (spec §1.3, §6.4).
// Differs from the user-portal sidebar (PortalSidebar) which uses the dark
// --ink background. Here we use #F2F0EE per spec.

const NAV_LABEL_KEY: Record<string, string> = {
  Workbench: "clinicNav.workbench",
  "AI Reports": "clinicNav.aiReports",
  "Skin Archive": "clinicNav.skinArchive",
  Patients: "clinicNav.patients",
  Appointments: "clinicNav.appointments",
  "Treatments & Billing": "clinicNav.treatments",
  "CRM & Follow-up": "clinicNav.crm",
  "DrRuby Referrals": "clinicNav.referrals",
  "Finance & Fees": "clinicNav.finance",
  Compliance: "clinicNav.compliance",
  "Modules & Billing": "clinicNav.modules",
  "Clinic Settings": "clinicNav.settings",
};

const SECTION_KEY: Record<string, string> = {
  Today: "clinicNav.today",
  Clinical: "clinicNav.clinical",
  Operations: "clinicNav.operations",
  Platform: "clinicNav.platform",
  Account: "clinicNav.account",
};

export default function ClinicSidebar() {
  const pathname = usePathname();
  const t = useTranslations("clinic");
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className="bg-[#F2F0EE] w-[220px] flex-shrink-0 flex flex-col h-full border-r border-dr-border">
      {/* Logo / clinic header */}
      <div className="px-6 pt-7 pb-5 border-b border-dr-border">
        <Link
          href="/"
          className="font-serif text-[18px] text-dr-ink no-underline leading-none"
        >
          Dr<span className="text-dr-red">Ruby</span>
        </Link>
        <div className="text-[10px] text-dr-mid mt-[3px]">
          {CLINIC_PROFILE.name}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {CLINIC_NAV.map((section) => (
          <div key={section.label}>
            <div className="text-[8px] font-semibold tracking-[0.22em] uppercase text-[rgba(0,0,0,0.5)] px-6 pt-2.5 pb-1">
              {SECTION_KEY[section.label] ? t(SECTION_KEY[section.label]) : section.label}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/clinic"
                  ? pathname === "/clinic"
                  : pathname.startsWith(item.href);
              const labelKey = NAV_LABEL_KEY[item.label];
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-6 text-[11px] no-underline border-l-2 transition-all ${
                    isActive
                      ? "text-dr-ink font-medium border-l-dr-red bg-[rgba(200,16,46,0.04)]"
                      : "text-dr-mid border-l-transparent hover:text-dr-ink"
                  }`}
                  style={{ paddingTop: "9px", paddingBottom: "9px" }}
                >
                  <span className="w-3.5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span>{labelKey ? t(labelKey) : item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-[8px] font-bold text-white px-[5px] py-px rounded-[2px] ${
                        item.badgeTone === "green" ? "bg-dr-success" : "bg-dr-red"
                      }`}
                    >
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
      <div className="px-6 py-4 border-t border-dr-border">
        <div className="text-[11px] text-dr-ink font-medium leading-[1.2]">
          {CLINIC_USER.doctorName}
        </div>
        <div className="text-[9px] text-dr-mid">{CLINIC_USER.role}</div>
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
