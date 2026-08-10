import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { TokenBootstrap } from "@/components/auth/TokenBootstrap";
import { routing } from "@/i18n/routing";
import { normalizeTheme, THEME_COOKIE } from "@/lib/theme";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const jost = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "DrRuby.ai — Women's Healthspan Intelligence",
  description:
    "DrRuby is a women's healthspan intelligence platform. We enter through skin — and connect it to everything else that's shifting in your body.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  // Read the theme preference server-side and render <html data-theme> directly
  // — first paint is correct with no FOUC and no inline anti-flash script.
  const theme = normalizeTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${cormorant.variable} ${jost.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <TokenBootstrap />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
