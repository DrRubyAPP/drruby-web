import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/config/site";

/**
 * next-intl 官方路由配置（单一数据源）。
 * `localePrefix: "as-needed"` → 默认语言 en 无前缀（/、/skin…），zh 带前缀（/zh…）。
 */
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});
