// Site-wide constants and configuration.

/** Pages shown in the top Navbar. `labelKey` resolves against the `nav` namespace. */
export const NAV_PAGES = [
  { key: "home", href: "/" },
  { key: "skin", href: "/skin" },
  { key: "healthspan", href: "/healthspan" },
  { key: "waitlist", href: "/waitlist" },
] as const;

/** Locales supported by the app. English-only for now; add more here later. */
export const SUPPORTED_LOCALES = ["en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
