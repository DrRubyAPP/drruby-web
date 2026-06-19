import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MobileMenu from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function Navbar() {
  const t = await getTranslations("nav");
  return (
    <nav className="bg-dr-white border-b border-dr-border h-16 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
      <Link
        href="/"
        className="font-serif text-[22px] text-dr-ink no-underline leading-none"
      >
        Dr<span className="text-dr-red">Ruby</span>.ai
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className="text-[14px] font-normal tracking-[0.1em] text-dr-mid no-underline hover:text-dr-ink transition-colors"
        >
          {t("howItWorks")}
        </Link>
        <Link
          href="/skin"
          className="text-[14px] font-normal tracking-[0.1em] text-dr-mid no-underline hover:text-dr-ink transition-colors"
        >
          {t("skin")}
        </Link>
        <Link
          href="/healthspan"
          className="text-[14px] font-normal tracking-[0.1em] text-dr-mid no-underline hover:text-dr-ink transition-colors"
        >
          {t("healthspan")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/waitlist"
          className="hidden md:inline-block text-[13px] font-medium tracking-[0.1em] text-dr-ink border border-dr-border px-[18px] py-2 no-underline hover:border-dr-ink transition-colors"
        >
          {t("login")}
        </Link>
        <Link
          href="/waitlist"
          className="hidden sm:inline-block text-[13px] font-semibold tracking-[0.16em] uppercase bg-dr-red text-white px-5 py-2 no-underline hover:opacity-90 transition-opacity"
        >
          {t("getStarted")}
        </Link>
        <MobileMenu />
      </div>
    </nav>
  );
}
