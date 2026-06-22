import type { AnswerData } from "@/config/user-portal-mock";
import MedicalDisclaimer from "@/components/common/MedicalDisclaimer";

const DELTA_COLOR: Record<string, string> = {
  up: "text-dr-success",
  down: "text-dr-red",
  flat: "text-dr-mid",
};

function MiniTrend({ values, dir }: { values: number[]; dir: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-0.5 h-5 mt-1">
      {values.map((v, i) => {
        const height = 30 + ((v - min) / range) * 70;
        return (
          <div
            key={i}
            className={`w-1 ${dir === "down" ? "bg-dr-red/40" : dir === "up" ? "bg-dr-success/50" : "bg-dr-mid/30"}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

export default function AnswerPage({ data }: { data: AnswerData }) {
  return (
    <div className="max-w-[760px]">
      {/* ① AnswerHeadline */}
      <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-2">
        {data.headline}
      </h1>

      {/* ② AnswerSubtitle */}
      <div className="text-[11px] text-dr-mid mb-6">{data.subtitle}</div>

      {/* ③ DataCards (max 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {data.dataCards.map((card, i) => (
          <div
            key={i}
            className="bg-dr-white border border-dr-border p-4 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[16px]">{card.icon}</span>
              <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-dr-mid">
                {card.metricName}
              </span>
            </div>
            <div className="font-serif text-[26px] font-light text-dr-ink leading-none mb-1">
              {card.currentValue}
            </div>
            <div className={`text-[11px] font-medium ${DELTA_COLOR[card.deltaDir]}`}>
              {card.delta}
            </div>
            <MiniTrend values={card.trend} dir={card.deltaDir} />
          </div>
        ))}
      </div>

      {/* ④ Explanation */}
      <div className="bg-dr-white border border-dr-border p-5 mb-4">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-red" />
          Why this is happening
        </div>
        <p className="text-[13px] text-dr-ink leading-[1.7]">{data.explanation}</p>
      </div>

      {/* ⑤ ActionCard (single action, with timeframe) */}
      <div className="bg-dr-white border-l-2 border-dr-red p-5 mb-4">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-2 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-red" />
          What to do · {data.actionCard.timeframe}
        </div>
        <div className="font-serif text-[20px] font-light text-dr-ink leading-[1.4]">
          {data.actionCard.text}
        </div>
      </div>

      {/* ⑥ SaveCard (mandatory) */}
      <div className="bg-dr-off border border-dr-border p-5 mb-4">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-mid" />
          What you don't need to do
        </div>
        <div className="text-[13px] text-dr-ink leading-[1.7]">
          {data.saveCard}
        </div>
      </div>

      {/* Refer notice if triggered (§10) */}
      {data.isRefer && data.referText && (
        <div className="bg-[rgba(184,106,0,0.05)] border-l-2 border-dr-warn p-4 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-warn mb-1.5">
            May benefit from a specialist
          </div>
          <div className="text-[12px] text-dr-ink leading-[1.6]">
            {data.referText}
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
