"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LogoutButton from "@/components/auth/LogoutButton";
import { PORTAL_USER } from "@/config/user-portal-mock";

interface PortalTopbarProps {
  pageTitle: string;
  pageSub: string;
  primaryAction?: { label: string; href?: string };
}

export default function PortalTopbar({
  pageTitle,
  pageSub,
  primaryAction,
}: PortalTopbarProps) {
  const t = useTranslations("portal");
  return (
    <div className="bg-dr-white px-5 md:px-7 h-[52px] flex items-center justify-between border-b border-dr-border sticky top-0 z-10">
      <div>
        <div className="font-serif text-[16px] text-dr-ink leading-none">
          {pageTitle}
        </div>
        <div className="text-[8px] font-semibold tracking-[0.18em] uppercase text-dr-red mt-[3px]">
          {pageSub}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="hidden sm:block text-[9px] bg-dr-off border border-dr-border px-2.5 py-1 text-dr-mid">
          🟢{" "}
          {t("topbar.sourcesConnected", {
            count: PORTAL_USER.connectedSources,
          })}
        </div>
        <Link
          href="/onboarding"
          className="text-[9px] font-semibold tracking-[0.14em] uppercase border border-dr-red text-dr-red px-3 py-1.5 no-underline hover:bg-[rgba(200,16,46,0.04)] transition-colors"
        >
          {t("topbar.onboarding")}
        </Link>
        <LogoutButton />
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
