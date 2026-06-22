"use client";

import { useTranslations } from "next-intl";
import { CLINIC_PROFILE, CLINIC_USER } from "@/config/clinic-portal-mock";

interface ClinicTopbarProps {
  pageTitle: string;
  pageSub?: string;
  primaryAction?: { label: string; href?: string };
}

// Clinic Portal topbar (spec §1.2, §0.3) — page title on the left, the
// patient-data-authorization notice (green dot) plus a primary CTA on the
// right. The notice is shown on every clinic page per spec §0.3.
export default function ClinicTopbar({
  pageTitle,
  pageSub,
  primaryAction,
}: ClinicTopbarProps) {
  const t = useTranslations("clinic");
  const sub = pageSub ?? CLINIC_PROFILE.topbarSub;
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
      <div className="flex gap-2 items-center">
        <div
          className="hidden sm:flex text-[9px] text-dr-mid bg-[rgba(31,158,90,0.06)] border border-[rgba(31,158,90,0.15)] px-3 py-1.5 items-center gap-1.5"
          title={t("topbar.authNoticeTooltip")}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-dr-success flex-shrink-0" />
          {t("topbar.authNotice")}
        </div>
        {primaryAction && (
          <a
            href={primaryAction.href ?? "#"}
            className="text-[9px] font-semibold tracking-[0.14em] uppercase bg-dr-red text-white px-3 py-1.5 no-underline hover:opacity-90 transition-opacity"
          >
            {primaryAction.label}
          </a>
        )}
      </div>
    </div>
  );
}

export { CLINIC_USER };
