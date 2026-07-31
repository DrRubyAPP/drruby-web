"use client";

import { useLocale, useTranslations } from "next-intl";
import { LOCALE_SWITCH_ENABLED, SUPPORTED_LOCALES } from "@/config/site";
import { usePathname, useRouter } from "@/i18n/navigation";

// Short display label for each locale's switch target.
const LABELS: Record<string, string> = { en: "EN", zh: "中文" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  // 语言切换默认关闭（全站英文）；由 .env 的 NEXT_PUBLIC_ENABLE_LOCALE_SWITCH 控制。
  if (!LOCALE_SWITCH_ENABLED) return null;

  // Two-locale toggle: pick the other supported locale.
  const next = SUPPORTED_LOCALES.find((l) => l !== locale) ?? locale;

  return (
    <button
      type="button"
      aria-label={t("language")}
      // usePathname() (from navigation) is locale-agnostic; router.replace adds
      // the correct prefix — en → no prefix, zh → /zh — keeping the same path.
      onClick={() => router.replace(pathname, { locale: next })}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-dr-fg hover:bg-dr-off transition-colors text-[13px]"
    >
      {LABELS[next] ?? next}
    </button>
  );
}
