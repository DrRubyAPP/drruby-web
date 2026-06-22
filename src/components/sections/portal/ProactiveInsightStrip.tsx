import Link from "next/link";
import type { ProactiveInsight } from "@/config/user-portal-mock";

const PRIORITY_COLOR: Record<string, string> = {
  P0: "#e8c97a",
  P1: "#4fc3f7",
  P2: "#26d1a0",
  P3: "#aaaaaa",
};

const PRIORITY_LABEL: Record<string, string> = {
  P0: "P0 · Significant change",
  P1: "P1 · Pattern detected",
  P2: "P2 · Check-in",
  P3: "P3 · Reminder",
};

export default function ProactiveInsightStrip({
  insight,
}: {
  insight: ProactiveInsight
}) {
  const color = PRIORITY_COLOR[insight.priority];
  return (
    <div
      className="bg-dr-white border-l-2 p-4 flex items-start gap-3"
      style={{ borderLeftColor: color }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1">
          {PRIORITY_LABEL[insight.priority]}
          {insight.source && (
            <span className="text-dr-mid/60 ml-2 normal-case tracking-normal">
              · {insight.source}
            </span>
          )}
        </div>
        <div className="font-serif text-[18px] font-light text-dr-ink leading-[1.3] mb-1">
          {insight.headline}
        </div>
        <div className="text-[12px] text-dr-mid leading-[1.6]">
          {insight.detail}
        </div>
      </div>
      <Link
        href={insight.ctaHref}
        className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red no-underline flex-shrink-0 hover:opacity-70 transition-opacity mt-1"
      >
        {insight.ctaLabel}
      </Link>
    </div>
  );
}
