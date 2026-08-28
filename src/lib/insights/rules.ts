import type { CreateBodyInsightInput } from "@/lib/db/repositories/bodyInsight.repo";
import type { Decision, Signal, TimelineEvent } from "~prisma/client";

/**
 * 洞察规则引擎（纯函数）
 * =====================
 *
 * 输入用户结构化数据，输出 `CreateBodyInsightInput[]`。
 * **数值 / trend / 置信 / accent / tone 一律由规则确定**——LLM 只在 generate.ts 润色文案，
 * 绝不改数值、不改枚举、不新增结论（Evidence Boundary / Non-directive 红线）。
 */
export interface InsightInput {
  signals: Signal[];
  timeline: TimelineEvent[];
  decisions: Decision[];
}

/** 单卡文案上限，避免堆积过多噪音卡片。 */
const MAX_ATTENTION = 6;

/**
 * attention 卡：从下行趋势信号与未决决策挑「值得关注」项。
 * accent 由规则定：observed 下行 → amber（较可信）；其余下行 → purple（需更多上下文）；
 * 未决决策 → purple（提示性、非催促）。
 */
export function computeAttention(data: InsightInput): CreateBodyInsightInput[] {
  const out: CreateBodyInsightInput[] = [];

  for (const s of data.signals) {
    if (s.trend === "down") {
      out.push({
        kind: "attention",
        tag: s.label,
        title: `${s.label} 最近走低`,
        body: `观察到 ${s.label} 为 ${s.value}${s.unit ?? ""}，趋势下行。`,
        accent: s.confidence === "observed" ? "amber" : "purple",
      });
    }
  }

  for (const d of data.decisions) {
    // 未决 = lifecycle 仍在 ACTIVE（尚未 DECIDED/OBSERVING/…）
    if (d.lifecycle === "ACTIVE") {
      out.push({
        kind: "attention",
        tag: "decision",
        title: `继续推进：${d.question}`,
        body: "该决策仍在推进中。",
        accent: "purple",
      });
    }
  }

  return out.slice(0, MAX_ATTENTION);
}

/**
 * aging_velocity 指标：由近期信号趋势算「变化速度」示意值与 tone。
 * tone 由规则定：有下行 → amber；有信号且无下行 → green；无信号 → purple（数据不足）。
 * value 为示意描述，非医学结论。
 */
export function computeAgingVelocity(
  data: InsightInput,
): CreateBodyInsightInput[] {
  const hasDown = data.signals.some((s) => s.trend === "down");
  const tone = hasDown ? "amber" : data.signals.length ? "green" : "purple";
  const value = data.signals.length
    ? `${data.signals.length} 项信号`
    : "数据不足";
  return [
    {
      kind: "aging_velocity",
      title: "变化速度", // body_insight.title 非空列；aging 读端点投影用 label/value/caption
      label: "变化速度",
      value,
      caption: "示意，非结论；需更多上下文。",
      tone,
    },
  ];
}
