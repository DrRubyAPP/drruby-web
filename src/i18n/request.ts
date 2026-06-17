import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/config/site";

// No-routing mode: a single locale is served without a URL prefix. To add
// more languages later, resolve the locale per request (e.g. from a cookie or
// header) and load the matching message file.
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
