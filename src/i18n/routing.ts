import { defineRouting } from "next-intl/routing";
import {
  DEFAULT_LOCALE,
  LOCALE_SWITCH_ENABLED,
  SUPPORTED_LOCALES,
} from "@/config/site";

/**
 * next-intl 官方路由配置（单一数据源）。
 * `localePrefix: "as-needed"` → 默认语言 en 无前缀（/、/skin…），zh 带前缀（/zh…）。
 * `localeDetection` 跟随语言切换开关 NEXT_PUBLIC_ENABLE_LOCALE_SWITCH：
 *   - 开启：按 Accept-Language/cookie 自动检测跳转；
 *   - 关闭：锁定默认语言，`/` 不再因浏览器语言被重定向到 `/zh`（zh 仍可手动直达）。
 */
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: LOCALE_SWITCH_ENABLED,
});
