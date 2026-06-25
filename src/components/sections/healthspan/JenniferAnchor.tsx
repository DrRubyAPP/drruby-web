import { getTranslations } from "next-intl/server";

export default async function JenniferAnchor() {
  const t = await getTranslations("healthspan.jennifer");
  return (
    <div className="bg-dr-white py-10 px-7 md:px-10 flex items-center gap-8 md:gap-12 border-b border-dr-border flex-col md:flex-row">
      <div className="flex-shrink-0 w-16 h-16 bg-dr-off border border-dr-border flex items-center justify-center">
        <span className="font-serif text-[26px] font-medium text-dr-ink">JG</span>
      </div>
      <div className="flex-1">
        <div className="font-serif text-[20px] font-medium text-dr-ink leading-[1.5] mb-2.5">
          &ldquo;{t("quote")}&rdquo;
        </div>
        <div className="text-[14px] text-[#111]">{t("who")}</div>
      </div>
      <div className="flex-shrink-0 text-left md:text-right">
        <div className="text-[14px] text-[#111] mb-1">{t("dayLabel")}</div>
        <div className="font-serif text-[22px] font-medium text-dr-ink">
          {t("dayValue")}
        </div>
        <div className="text-[14px] text-[#111]">{t("daySub")}</div>
      </div>
    </div>
  );
}
