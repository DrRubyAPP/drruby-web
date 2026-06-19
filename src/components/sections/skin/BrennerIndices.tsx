import { getTranslations } from "next-intl/server";
import { BRENNER_INDICES } from "@/config/skin-mock";

const LEVEL_COLOR: Record<string, string> = {
  good: "text-dr-success",
  warn: "text-dr-warn",
  alert: "text-dr-red",
};

const LEVEL_BAR: Record<string, string> = {
  good: "bg-dr-success",
  warn: "bg-dr-warn",
  alert: "bg-dr-red",
};

export default async function BrennerIndices() {
  const t = await getTranslations("skin.indices");
  return (
    <>
      <div className="pt-5 px-7 bg-dr-off">
        <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
          <span className="block w-3 h-px bg-dr-red" />
          {t("sectionLabel")}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-dr-border mx-7">
        {BRENNER_INDICES.map((idx, i) => (
          <div
            key={idx.id}
            className={`p-7 ${i === 1 ? "bg-dr-off" : "bg-dr-white"}`}
          >
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-dr-red mb-2.5">
              {idx.eyebrow}
            </div>
            <div className="font-serif text-[22px] font-light text-dr-ink mb-3.5">
              {idx.name}
            </div>
            <div className="flex items-baseline gap-2.5 mb-3">
              <div
                className={`font-serif text-[52px] font-light leading-none ${LEVEL_COLOR[idx.level]}`}
              >
                {idx.score}
              </div>
              <div className="text-sm text-dr-mid">/{idx.max}</div>
            </div>
            <div className="h-1 bg-dr-grey mb-2.5">
              <div
                className={`h-full ${LEVEL_BAR[idx.level]}`}
                style={{ width: `${idx.score}%`, transition: "width 1s" }}
              />
            </div>
            <p className="text-[11px] text-dr-mid leading-[1.7] font-light">
              {idx.desc}
            </p>
            <div
              className={`text-[10px] mt-2 font-medium ${
                idx.trend.dir === "up" ? "text-dr-success" : "text-dr-red"
              }`}
            >
              {idx.trend.text}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-7 mb-0 py-2.5 px-3.5 bg-[rgba(200,16,46,0.04)] border border-[rgba(200,16,46,0.1)] border-t-0">
        <span className="text-[10px] text-dr-mid">
          🔬{" "}
          <strong className="text-dr-ink">{t("scopeNote")}</strong>{" "}
          <span className="text-dr-red cursor-pointer font-semibold">
            {t("scopeUpgrade")}
          </span>
        </span>
      </div>
    </>
  );
}
