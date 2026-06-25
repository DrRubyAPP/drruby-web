import { getTranslations } from "next-intl/server";

export default async function TrustBar() {
  const t = await getTranslations("home.trust");
  return (
    <div className="bg-[#F0EEEB] px-6 md:px-16 flex flex-wrap items-stretch border-y border-dr-border gap-y-3">
      <div className="flex items-center gap-4 py-[18px] md:py-5 pr-6 md:pr-10 mr-6 md:mr-10 md:border-r border-dr-border">
        <div className="w-11 h-11 border border-[rgba(200,16,46,0.3)] rounded-full flex items-center justify-center font-serif text-[20px] font-semibold text-dr-red flex-shrink-0">
          B
        </div>
        <div>
          <div className="text-[15px] font-bold text-dr-ink leading-[1.3]">
            {t("brennerName")}
          </div>
          <div className="text-[13px] font-medium text-[#444] tracking-[0.04em] mt-[3px] leading-[1.5]">
            {t("brennerRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 py-[18px] md:py-5 pr-6 md:pr-10 mr-6 md:mr-10 md:border-r border-dr-border">
        <div className="w-11 h-11 border border-[rgba(200,16,46,0.3)] rounded-full flex items-center justify-center font-serif text-[20px] font-semibold text-dr-red flex-shrink-0">
          J
        </div>
        <div>
          <div className="text-[15px] font-bold text-dr-ink leading-[1.3]">
            {t("gunterName")}
          </div>
          <div className="text-[13px] font-medium text-[#444] tracking-[0.04em] mt-[3px] leading-[1.5]">
            {t("gunterRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 py-[18px] md:py-5">
        <div className="w-11 h-11 border border-[rgba(200,16,46,0.4)] rounded-full flex items-center justify-center font-serif text-[20px] font-semibold text-dr-red flex-shrink-0">
          +
        </div>
        <div>
          <div className="text-[15px] font-bold text-dr-ink leading-[1.3]">
            {t("boardName")}
          </div>
          <div className="text-[13px] font-medium text-[#444] tracking-[0.04em] mt-[3px] leading-[1.5]">
            {t("boardRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 md:ml-auto md:pl-10 md:border-l border-dr-border w-full md:w-auto">
        <div className="w-[7px] h-[7px] rounded-full bg-dr-red flex-shrink-0" />
        <div className="text-[13px] font-medium text-[#111] tracking-[0.06em]">
          {t("privacy")}
        </div>
      </div>
    </div>
  );
}
