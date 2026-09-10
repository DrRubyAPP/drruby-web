"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useApi } from "@/hooks/useApi";
import LogoutButton from "@/components/auth/LogoutButton";
import { getInitials } from "@/lib/portal/dashboard";

interface MeResponse {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  role: string;
  subscriptionTier: string;
}

type NavItem = {
  href: string;
  titleKey: string;
  subKey: string;
  icon: React.ReactNode;
};

const MAIN_NAV: NavItem[] = [
  {
    href: "/portal",
    titleKey: "dashboard.tabs.home.label",
    subKey: "dashboard.tabs.home.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    href: "/portal/health",
    titleKey: "dashboard.tabs.health.label",
    subKey: "dashboard.tabs.health.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7.5-4.35-9.5-8.5C.8 8 2.3 4.5 6 4.5c2 0 3.6 1.2 6 3.8 2.4-2.6 4-3.8 6-3.8 3.7 0 5.2 3.5 3.5 7C19.5 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    href: "/portal/decisions",
    titleKey: "dashboard.tabs.decisions.label",
    subKey: "dashboard.tabs.decisions.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3 8-8" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

export default function PortalSidebar() {
  const t = useTranslations("portal");
  const pathname = usePathname();
  const { data: me } = useApi<MeResponse>("/api/me");

  const isActive = (href: string) => {
    if (href === "/portal") {
      return pathname === "/portal";
    }
    return pathname.startsWith(href);
  };

  const meName = me?.name ?? "";

  return (
    <aside className="side">
      <Link href="/" className="logo">
        Dr<span>Ruby</span>
      </Link>
      <div className="logo-sub">{t("brandSub")}</div>
      <nav className="nav">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? " active" : ""}`}
          >
            <span className="ni-ic">{item.icon}</span>
            <span className="ni-tx">
              <b>{t(item.titleKey)}</b>
              <small>{t(item.subKey)}</small>
            </span>
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <LogoutButton className="mb-2 ml-3 bg-transparent border-0 p-0 text-left text-[13px] font-normal text-[#6b6561] cursor-pointer hover:text-[#b74f53] hover:opacity-100 transition-colors disabled:opacity-60" />
        <Link href="/portal/settings" className="profile">
          <div className="avatar">
            {me ? getInitials(meName) || "—" : "—"}
          </div>
          <div>
            <div className="pname">{me ? meName || "—" : "—"}</div>
            <div className="pmail">{me?.email ?? "—"}</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
