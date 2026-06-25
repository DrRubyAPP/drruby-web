import { getTranslations } from "next-intl/server";

export default async function ClinicEntry() {
  const t = await getTranslations("skin.clinicEntry");
  return (
    <div className="bg-dr-wine py-6 md:py-8 px-5 md:px-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 mx-4 md:mx-7 mb-5">
      <div>
        <div className="text-[14px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-2">
          {t("eyebrow")}
        </div>
        <div className="font-serif text-[22px] font-light text-white leading-[1.3]">
          {t("title")}
        </div>
        <div className="text-[15px] text-white/30 mt-1.5 leading-[1.6] max-w-[360px]">
          {t("desc")}
        </div>
      </div>
      <button
        type="button"
        className="text-[14px] font-semibold tracking-[0.16em] uppercase bg-dr-red text-white px-6 py-3 border-none cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity w-full md:w-fit"
      >
        {t("cta")}
      </button>
    </div>
  );
}
