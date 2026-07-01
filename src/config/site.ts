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
