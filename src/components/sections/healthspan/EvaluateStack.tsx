import { getTranslations } from "next-intl/server";

interface PanelEntry {
  name: string;
  dose: string;
  status: string;
  statusLevel: "good" | "warn" | "alert";
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  good: {
    bg: "bg-[rgba(31,158,90,0.08)]",
    text: "text-dr-success",
    label: "✓ Supported",
  },
  warn: {
    bg: "bg-[rgba(184,106,0,0.08)]",
    text: "text-dr-warn",
    label: "⚡ Review dose",
  },
  alert: {
    bg: "bg-[rgba(200,16,46,0.08)]",
    text: "text-dr-red",
    label: "↔ Redundant",
  },
};

export default async function EvaluateStack() {
  const t = await getTranslations("healthspan.evaluateStack");
  const bullets = t.raw("bullets") as string[];
  const panelEntries = t.raw("panelEntries") as PanelEntry[];
  return (
    <section className="bg-dr-off border border-dr-border py-9 px-10">
      <div className="flex items-start justify-between gap-10 flex-col md:flex-row">
        {/* Left: description */}
        <div className="flex-1 max-w-[400px]">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-2.5">
            {t("eyebrow")}
          </div>
          <h2 className="font-serif text-[28px] font-light text-dr-ink leading-[1.3] mb-3.5">
            {t("title")}
          </h2>
          <p className="text-[12px] text-dr-mid leading-[1.7] mb-4.5">
            {t("desc")}
          </p>
          <div className="text-[11px] text-dr-mid leading-[1.8] mb-5">
            {bullets.map((b, i) => (
              <div key={i} className="mb-1.5">
                ✓ {b}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="bg-dr-red text-white border-none px-5.5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase cursor-pointer hover:opacity-90 transition-opacity"
          >
            {t("cta")}
          </button>
        </div>

        {/* Right: mockup input panel */}
        <div className="flex-1 bg-dr-white border border-dr-border p-5.5">
          <div className="text-[11px] font-semibold text-dr-ink mb-4 tracking-[0.05em]">
            {t("panelTitle")}
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {panelEntries.map((item, i) => {
              const style = STATUS_STYLE[item.statusLevel];
              const isAlert = item.statusLevel === "alert";
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2.5 border ${
                    isAlert
                      ? "bg-[rgba(200,16,46,0.03)] border-[rgba(200,16,46,0.12)]"
                      : "bg-dr-off border-dr-border"
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-medium text-dr-ink">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-dr-mid">{item.dose}</div>
                  </div>
                  <div
                    className={`text-[10px] font-semibold ${style.text} ${style.bg} px-2 py-0.5`}
                  >
                    {style.label}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-3 py-2.5 bg-dr-off border border-dashed border-dr-border cursor-pointer text-dr-mid">
              <div className="text-[11px]">{t("addEntry")}</div>
              <div className="text-sm text-dr-red">+</div>
            </div>
          </div>
          {/* AI Insight */}
          <div className="bg-dr-ink p-3.5 mt-1">
            <div className="text-[10px] font-semibold tracking-[0.15em] text-white/40 uppercase mb-1.5">
              {t("assessmentLabel")}
            </div>
            <p className="text-[11px] text-white leading-[1.6]">
              {t("assessment")}
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                className="bg-dr-red text-white border-none px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] cursor-pointer"
              >
                {t("exportBtn")}
              </button>
              <button
                type="button"
                className="bg-transparent text-white/50 border border-white/15 px-3.5 py-1.5 text-[10px] cursor-pointer"
              >
                {t("viewFullBtn")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
