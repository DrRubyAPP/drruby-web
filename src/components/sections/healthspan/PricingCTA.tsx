import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function PricingCTA() {
  const t = await getTranslations("healthspan.cta");
  return (
    <>
      <div className="bg-dr-red py-8 px-7 md:px-10 flex items-center justify-between gap-6 flex-col md:flex-row">
        <div>
          <div className="font-serif text-[22px] font-medium text-white mb-1.5">
            {t("title")}
          </div>
          <div className="text-[15px] text-white/60">{t("subtitle")}</div>
        </div>
        <div className="flex gap-3 flex-shrink-0 flex-col sm:flex-row w-full md:w-auto">
          <Link
            href="/portal"
            className="bg-white text-dr-red border-none px-5.5 py-2.5 text-[15px] font-bold tracking-[0.1em] cursor-pointer no-underline hover:opacity-90 transition-opacity text-center"
          >
            {t("primary")}
          </Link>
          <Link
            href="/skin"
            className="bg-transparent text-white border border-white/40 px-5.5 py-2.5 text-[15px] font-semibold tracking-[0.1em] cursor-pointer no-underline hover:bg-white/10 transition-colors text-center"
          >
            {t("ghost")}
          </Link>
        </div>
      </div>
      {/* Healthspan → Clinic bridge */}
      <div className="bg-dr-off border-t border-dr-border py-4.5 px-7 md:px-10 flex items-center justify-between flex-col md:flex-row gap-3">
        <div className="text-[15px] text-[#111]">{t("bridgeText")}</div>
        <Link
          href="/clinic"
          className="bg-transparent border border-dr-border text-dr-ink px-4.5 py-1.5 text-[14px] font-semibold cursor-pointer tracking-[0.1em] hover:bg-dr-white transition-colors no-underline"
        >
          {t("bridgeCta")}
        </Link>
      </div>
    </>
  );
}
