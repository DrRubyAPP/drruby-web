import { getTranslations } from "next-intl/server";

export default async function SkinPageNav() {
  const t = await getTranslations("skin.pageNav");
  return (
    <div className="bg-dr-white px-8 h-[52px] flex items-center justify-between border-b border-dr-border sticky top-0 z-10">
      <div className="text-[13px] text-dr-mid flex items-center gap-2">
        <span className="text-dr-mid text-sm">←</span>
        {t("breadcrumb")}
        <span className="text-dr-mid">&nbsp;/&nbsp;</span>
        <span className="text-dr-ink font-medium">{t("breadcrumbCurrent")}</span>
      </div>
      <div className="flex gap-2 items-center">
        <div className="text-[12px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-white bg-dr-ink border-dr-ink">
          {t("modePhone")}
        </div>
        <div className="text-[12px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-mid">
          {t("modeScope")}
        </div>
        <div className="text-[12px] font-semibold tracking-[0.12em] uppercase border border-dr-border py-[5px] px-3 cursor-pointer text-dr-mid">
          {t("modeUpload")}
        </div>
      </div>
    </div>
  );
}
