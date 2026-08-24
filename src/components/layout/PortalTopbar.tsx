"use client";

import { useTranslations } from "next-intl";
import LogoutButton from "@/components/auth/LogoutButton";
import { Link } from "@/i18n/navigation";

interface PortalTopbarProps {
  pageTitle: string;
  pageSub: string;
  /** flows 页传入：渲染 "← Back to portal" 返回链接，替代右侧操作区 */
  backHref?: string;
  primaryAction?: { label: string; href?: string };
}

export default function PortalTopbar({
  pageTitle,
  pageSub,
  backHref,
  primaryAction,
}: PortalTopbarProps) {
  const t = useTranslations("portal");
  return (
    <div className="portal-topbar">
      <div>
        <div className="pt-title">{pageTitle}</div>
        <div className="pt-sub">{pageSub}</div>
      </div>
      {backHref ? (
        <Link href={backHref} className="pt-back">
          <span aria-hidden="true">←</span> {t("topbar.backToPortal")}
        </Link>
      ) : (
        <div className="pt-actions">
          <Link href="/onboarding" className="pt-onboarding">
            {t("topbar.onboarding")}
          </Link>
          <LogoutButton className="pt-logout" />
          {primaryAction && (
            <a href={primaryAction.href ?? "#"} className="pt-primary">
              {primaryAction.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
