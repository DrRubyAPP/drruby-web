// Site-wide constants and configuration.

/** Pages shown in the top Navbar. `labelKey` resolves against the `nav` namespace. */
export const NAV_PAGES = [
  { key: "home", href: "/" },
  { key: "skin", href: "/skin" },
  { key: "healthspan", href: "/healthspan" },
  { key: "waitlist", href: "/waitlist" },
] as const;

/** Locales supported by the app. `en` is the default (no URL prefix); `zh` is
 *  served under a `/zh` prefix. Add more here to extend. */
export const SUPPORTED_LOCALES = ["en", "zh"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * 中英文切换开关。默认关闭：隐藏语言切换按钮，全站默认英文。
 * 在 .env 设置 NEXT_PUBLIC_ENABLE_LOCALE_SWITCH=true 可重新开启切换。
 */
export const LOCALE_SWITCH_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCALE_SWITCH === "true";
