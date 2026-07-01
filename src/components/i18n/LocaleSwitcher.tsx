"use client";

import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@/config/site";
import { usePathname, useRouter } from "@/i18n/navigation";

// Short display label for each locale's switch target.
const LABELS: Record<string, string> = { en: "EN", zh: "中文" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

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
