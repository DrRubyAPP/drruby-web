"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/auth/UserAvatar";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import { homeHrefForRole, homeNavKeyForRole } from "@/lib/auth/roles";

interface UserMenuProps {
  role: string | null;
  image?: string | null;
  name?: string | null;
  email?: string | null;
}

/**
 * 头像下拉菜单：点击头像展开，含两项——用户首页（portal/clinic）与登出。
 * 点击外部或按 Esc 收起；登出后回首页并刷新以更新导航态。
 */
export default function UserMenu({ role, image, name, email }: UserMenuProps) {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const homeHref = homeHrefForRole(role);
  const homeLabel = t(homeNavKeyForRole(role));

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function onLogout() {
    setLoading(true);
    try {
      await authClient.signOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const itemClass =
    "block w-full text-left px-4 py-2.5 text-[13px] tracking-[0.06em] text-dr-ink no-underline hover:bg-dr-off transition-colors disabled:opacity-60";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account")}
        className="flex items-center rounded-full ring-1 ring-transparent hover:ring-dr-ink transition-shadow"
      >
        <UserAvatar
          image={image}
          name={name}
          email={email}
          label={t("account")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 bg-dr-white border border-dr-border shadow-lg py-1 z-[60]"
        >
          <Link
            role="menuitem"
            href={homeHref}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            {homeLabel}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={onLogout}
            disabled={loading}
            className={`${itemClass} border-t border-dr-border text-dr-mid hover:text-dr-ink`}
          >
            {tAuth("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
