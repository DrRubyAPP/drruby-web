"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

/**
 * 登出按钮：调用 Better Auth signOut 后跳转登录页。
 * 复用于 Portal / Clinic 顶栏。
 */
export default function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={
        className ??
        "text-[9px] font-semibold tracking-[0.14em] uppercase border border-dr-border text-dr-mid px-3 py-1.5 hover:border-dr-ink hover:text-dr-ink transition-colors disabled:opacity-60"
      }
    >
      {t("logout")}
    </button>
  );
}
