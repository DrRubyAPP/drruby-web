import { getTranslations } from "next-intl/server";

export default async function SkinPageNav() {
  const t = await getTranslations("skin.pageNav");
  return (
    <div className="bg-dr-white px-4 md:px-8 h-[52px] flex items-center justify-between gap-3 border-b border-dr-border sticky top-0 z-10">
      <div className="text-[15px] text-dr-mid flex items-center gap-2 min-w-0 flex-shrink">
        <span className="text-dr-mid text-sm">←</span>
        <span className="truncate">
          {t("breadcrumb")}
          <span className="text-dr-mid">&nbsp;/&nbsp;</span>
          <span className="text-dr-ink font-medium">{t("breadcrumbCurrent")}</span>
        </span>
      </div>
      <div className="flex gap-2 items-center flex-shrink-0 overflow-x-auto no-scrollbar">
        <div className="text-[14px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-white bg-dr-ink border-dr-ink whitespace-nowrap">
          {t("modePhone")}
        </div>
        <div className="text-[14px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-mid whitespace-nowrap">
          {t("modeScope")}
        </div>
        <div className="text-[14px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-mid whitespace-nowrap">
          {t("modeUpload")}
        </div>
      </div>
    </div>
  );
}
