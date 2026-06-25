import { getTranslations } from "next-intl/server";

export default async function EngineeringNotes() {
  const t = await getTranslations("skin.engNotes");
  const freqRules = t.raw("freqRules") as string[];
  const qualityRules = t.raw("qualityRules") as string[];

  return (
    <div className="bg-[#FFFBE6] border border-[#E8D080] border-t-0 px-5 py-3.5">
      <div className="text-[14px] font-bold text-[#7A5C00] tracking-[0.12em] uppercase mb-2.5">
        {t("title")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[14px] font-bold text-[#7A5C00] mb-1">
            {t("freqTitle")}
          </div>
          <ul className="text-[14px] text-[#8B6914] leading-[1.8]">
            {freqRules.map((rule) => (
              <li key={rule}>· {rule}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[14px] font-bold text-[#7A5C00] mb-1">
            {t("qualityTitle")}
          </div>
          <ul className="text-[14px] text-[#8B6914] leading-[1.8]">
            {qualityRules.map((rule) => (
              <li key={rule}>· {rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
