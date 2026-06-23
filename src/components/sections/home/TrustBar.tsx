import { getTranslations } from "next-intl/server";

export default async function TrustBar() {
  const t = await getTranslations("home.trust");
  return (
    <div className="bg-dr-wine px-6 md:px-18 flex flex-wrap items-stretch border-t border-white/4 gap-y-3">
      <div className="flex items-center gap-3.5 py-[14px] md:py-[18px] pr-6 md:pr-8 mr-6 md:mr-8 md:border-r border-white/6">
        <div className="w-7 h-7 border border-[rgba(200,16,46,0.3)] rounded-full flex items-center justify-center text-[14px] flex-shrink-0 text-white/65">
          B
        </div>
        <div>
          <div className="text-[13px] font-medium text-white/65 leading-[1.3]">
            {t("brennerName")}
          </div>
          <div className="text-[12px] text-white/22 tracking-[0.06em] mt-px">
            {t("brennerRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3.5 py-[14px] md:py-[18px] pr-6 md:pr-8 mr-6 md:mr-8 md:border-r border-white/6">
        <div className="w-7 h-7 border border-[rgba(200,16,46,0.3)] rounded-full flex items-center justify-center text-[14px] flex-shrink-0 text-white/65">
          J
        </div>
        <div>
          <div className="text-[13px] font-medium text-white/65 leading-[1.3]">
            {t("gunterName")}
          </div>
          <div className="text-[12px] text-white/22 tracking-[0.06em] mt-px">
            {t("gunterRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3.5 py-[14px] md:py-[18px]">
        <div className="w-7 h-7 border border-[rgba(31,158,90,0.4)] rounded-full flex items-center justify-center text-[14px] flex-shrink-0 text-white/65">
          +
        </div>
        <div>
          <div className="text-[13px] font-medium text-white/65 leading-[1.3]">
            {t("boardName")}
          </div>
          <div className="text-[12px] text-white/22 tracking-[0.06em] mt-px">
            {t("boardRole")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 md:ml-auto md:pl-8 md:border-l border-white/6 w-full md:w-auto">
        <div className="w-1.5 h-1.5 rounded-full bg-dr-success flex-shrink-0" />
        <div className="text-[12px] font-medium text-white/35 tracking-[0.08em]">
          {t("privacy")}
        </div>
      </div>
    </div>
  );
}
