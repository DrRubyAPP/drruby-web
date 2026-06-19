import { getTranslations } from "next-intl/server";
import { TREND_DATA } from "@/config/skin-mock";

export default async function TrendChart() {
  const t = await getTranslations("skin.trend");
  return (
    <div className="bg-dr-white border border-dr-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="text-[11px] font-semibold text-dr-ink">{t("title")}</div>
        <div className="flex gap-1">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-1 cursor-pointer text-dr-mid border border-transparent">
            {t("period30d")}
          </div>
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-1 cursor-pointer text-dr-ink border border-dr-border">
            {t("period90d")}
          </div>
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-1 cursor-pointer text-dr-mid border border-transparent">
            {t("period1yr")}
          </div>
        </div>
      </div>
      <div className="h-[100px] flex items-end gap-1.5 pb-1 border-b border-dr-border">
        {TREND_DATA.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-[3px]"
          >
            <div className="flex gap-0.5 items-end w-full justify-center">
              <div
                className="w-1.5"
                style={{
                  height: d.infl,
                  background: d.highlight
                    ? "rgba(200,16,46,0.75)"
                    : "rgba(200,16,46,0.4)",
                }}
              />
              <div
                className="w-1.5"
                style={{
                  height: d.pigm,
                  background: d.highlight
                    ? "rgba(184,106,0,0.75)"
                    : "rgba(184,106,0,0.4)",
                }}
              />
              <div
                className="w-1.5"
                style={{
                  height: d.coll,
                  background: d.highlight
                    ? "rgba(31,158,90,0.75)"
                    : "rgba(31,158,90,0.4)",
                }}
              />
            </div>
            <div
              className={`text-[9px] ${
                d.highlight
                  ? "text-dr-red font-semibold"
                  : "text-dr-mid"
              }`}
            >
              {d.date}
              {d.highlight && " ●"}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[rgba(200,16,46,0.5)]" />
          <span className="text-[10px] text-dr-mid">{t("legendInfl")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[rgba(184,106,0,0.5)]" />
          <span className="text-[10px] text-dr-mid">{t("legendPigm")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[rgba(31,158,90,0.5)]" />
          <span className="text-[10px] text-dr-mid">{t("legendColl")}</span>
        </div>
      </div>
      <div className="mt-3 px-3 py-2.5 bg-dr-off border-l-2 border-dr-success">
        <div className="text-[11px] font-medium text-dr-ink">
          {t("overallTitle")}
        </div>
        <div className="text-[10px] text-dr-mid mt-0.5">
          {t("overallDesc")}
        </div>
      </div>
    </div>
  );
}
