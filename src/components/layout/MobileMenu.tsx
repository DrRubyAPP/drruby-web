"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import UserAvatar from "@/components/auth/UserAvatar";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { LOCALE_SWITCH_ENABLED } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { homeHrefForRole } from "@/lib/auth/roles";

interface NavLink {
  href: string;
  key: "howItWorks" | "skin" | "healthspan" | "portal" | "clinic";
}

// 始终可见的公开链接。
const PUBLIC_LINKS: NavLink[] = [
  { href: "/", key: "howItWorks" },
  { href: "/skin", key: "skin" },
  { href: "/healthspan", key: "healthspan" },
];

interface MobileMenuProps {
  isAuthed: boolean;
  role: string | null;
  image?: string | null;
  name?: string | null;
  email?: string | null;
}

export default function MobileMenu({
  isAuthed,
  role,
  image,
  name,
  email,
}: MobileMenuProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onLogout() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // 未登录不显示 portal/clinic；登录后按角色只显示对应的一项。
  const links: NavLink[] = [...PUBLIC_LINKS];
  if (isAuthed && role === "user") {
    links.push({ href: "/portal", key: "portal" });
  }
  if (isAuthed && role === "clinic") {
    links.push({ href: "/clinic", key: "clinic" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-[5px] w-7 h-7 items-center justify-center"
        aria-label={t("menu")}
      >
        <span className="block w-5 h-px bg-dr-ink" />
        <span className="block w-5 h-px bg-dr-ink" />
        <span className="block w-5 h-px bg-dr-ink" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
        >
          <div
            className="absolute inset-0 bg-dr-ink/40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen(false);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-[280px] max-w-[80vw] bg-dr-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-dr-border">
              <span className="font-serif text-[18px] text-dr-ink">
                Dr<span className="text-dr-red">Ruby</span>.ai
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-dr-ink"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col py-4">
              {links.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-6 py-3.5 text-[15px] font-normal tracking-[0.08em] text-dr-ink no-underline hover:bg-dr-off transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-6 border-t border-dr-border flex flex-col gap-3">
              {LOCALE_SWITCH_ENABLED && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[13px] tracking-[0.08em] text-dr-mid">
                    {t("language")}
                  </span>
                  <LocaleSwitcher />
                </div>
              )}
              {isAuthed ? (
                <>
                  <Link
                    href={homeHrefForRole(role)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 no-underline"
                  >
                    <UserAvatar
                      image={image}
                      name={name}
                      email={email}
                      label={t("account")}
                    />
                    <span className="text-[14px] font-medium text-dr-ink truncate">
                      {name || email}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-center text-[13px] font-medium tracking-[0.1em] text-dr-mid border border-dr-border px-5 py-3 hover:border-dr-ink hover:text-dr-ink transition-colors"
                  >
                    {tAuth("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/waitlist"
                    onClick={() => setOpen(false)}
                    className="text-center text-[13px] font-semibold tracking-[0.16em] uppercase bg-dr-red text-white px-5 py-3 no-underline hover:opacity-90 transition-opacity"
                  >
                    {t("getStarted")}
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-center text-[13px] font-medium tracking-[0.1em] text-dr-ink border border-dr-border px-5 py-3 no-underline hover:border-dr-ink transition-colors"
                  >
                    {t("login")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
