import { getTranslations } from "next-intl/server";

export default async function ClinicEntry() {
  const t = await getTranslations("skin.clinicEntry");
  return (
    <div className="bg-dr-wine py-8 px-7 flex items-center justify-between gap-6 mx-7 mb-5">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.5)] mb-2">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[22px] font-light text-white leading-[1.3]">
          {t("title")}
        </div>
        <div className="text-[13px] text-white/30 mt-1.5 leading-[1.6] max-w-[360px]">
          {t("desc")}
        </div>
      </div>
      <button
        type="button"
        className="text-[13px] font-semibold tracking-[0.16em] uppercase bg-dr-red text-white px-6 py-3 border-none cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
      >
        {t("cta")}
      </button>
    </div>
  );
}
