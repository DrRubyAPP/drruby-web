// Site-wide constants and configuration.

/** Pages shown in the top Navbar. `labelKey` resolves against the `nav` namespace. */
export const NAV_PAGES = [
  { key: "home", href: "/" },
  { key: "skin", href: "/portal" },
  { key: "healthspan", href: "/portal" },
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

/**
 * 首页登录入口开关。默认关闭（false），顶栏正常显示 Log in 按钮 / 已登录头像。
 * 在 .env 设置 NEXT_PUBLIC_HIDE_HOME_LOGIN=true 可屏蔽公开页顶栏的登录入口：
 * 未登录不显示 Log in 按钮；已登录（浏览器持有 session）也不显示用户头像。
 */
export const HIDE_HOME_LOGIN =
  process.env.NEXT_PUBLIC_HIDE_HOME_LOGIN === "true";
