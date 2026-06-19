import { getTranslations } from "next-intl/server";
import { AI_FINDINGS } from "@/config/skin-mock";

const LEVEL_BORDER: Record<string, string> = {
  good: "border-l-dr-success",
  warn: "border-l-dr-warn",
  alert: "border-l-dr-red",
};

const TAG_STYLE: Record<string, string> = {
  good: "bg-[rgba(31,158,90,0.1)] text-dr-success",
  warn: "bg-[rgba(184,106,0,0.1)] text-dr-warn",
  alert: "bg-[rgba(200,16,46,0.08)] text-dr-red",
};

export default async function AIReport() {
  const t = await getTranslations("skin.aiReport");
  return (
    <div className="bg-dr-white border border-dr-border p-5">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
        <span className="block w-2.5 h-px bg-dr-red" />
        {t("title")}
      </div>
      <div className="flex flex-col gap-2">
        {AI_FINDINGS.map((f, i) => (
          <div
            key={i}
            className={`flex gap-3 px-3 py-2.5 bg-dr-off border-l-2 ${LEVEL_BORDER[f.level]}`}
          >
            <div className="flex-1">
              <div className="text-[12px] font-semibold text-dr-ink mb-0.5">
                {f.title}
              </div>
              <div className="text-[10px] text-dr-mid leading-[1.6]">
                {f.desc}
              </div>
            </div>
            <div
              className={`text-[9px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 h-fit flex-shrink-0 ${TAG_STYLE[f.level]}`}
            >
              {f.tag}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 pt-3 border-t border-dr-border flex justify-between items-center">
        <span className="text-[10px] text-dr-mid">{t("basedOn")}</span>
        <span className="text-[10px] font-semibold text-dr-red tracking-[0.12em] uppercase cursor-pointer">
          {t("fullReport")}
        </span>
      </div>
    </div>
  );
}
