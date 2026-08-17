import type { FindingLevel } from "@/lib/db/enums";
import type { AiReportFinding } from "@/lib/db/repositories/aiReport.repo";
import type { BodyInsight, HormoneReading, SkinScan } from "~prisma/client";

/**
 * skin zone status → finding level。
 * App 契约中 status 是自由字符串（无枚举），做宽容关键词映射、未知值不抛错。
 */
export function statusLevel(status: string): FindingLevel {
  const s = status.toLowerCase();
  if (/(good|healthy|clear|stable)/.test(s)) return "good";
  if (/(alert|concern|risk|worse|bad|attention)/.test(s)) return "alert";
  return "warn";
}

/** body_insight.accent（attention 卡）：red→alert，amber/purple/null→warn */
export function accentLevel(accent: string | null): FindingLevel {
  if (accent === "red") return "alert";
  return "warn"; // amber / purple / null
}

/** body_insight.tone（aging 卡）：green→good，amber/purple/null→warn */
export function toneLevel(tone: string | null): FindingLevel {
  if (tone === "green") return "good";
  return "warn"; // amber / purple / null
}

/** zones JSON 宽容解析：形状不符按空处理，不抛错 */
export function buildSkinFindings(scan: SkinScan): AiReportFinding[] {
  const zones = Array.isArray(scan.zones)
    ? (scan.zones as { name?: unknown; status?: unknown }[])
    : [];
  return zones
    .filter((z) => typeof z?.name === "string" && typeof z?.status === "string")
    .map((z) => ({
      level: statusLevel(z.status as string),
      tag: z.name as string,
      title: `${z.name}：${z.status}`,
      desc: `最近一次扫描中该区域状态为 ${z.status}。`,
    }));
}

/** 激素读数无参考范围规则 → level 统一中性 good（不贩卖焦虑），仅客观呈现数值 */
export function buildHormoneFindings(
  readings: HormoneReading[],
): AiReportFinding[] {
  return readings.slice(0, 10).map((r) => ({
    level: "good" as const,
    tag: r.marker,
    title: `${r.marker}（${r.phase}）`,
    desc: r.note ? `${r.value} — ${r.note}` : r.value,
  }));
}

export function buildBodyFindings(
  attentions: BodyInsight[],
  agings: BodyInsight[],
): AiReportFinding[] {
  return [
    ...attentions.map((a) => ({
      level: accentLevel(a.accent),
      tag: a.tag ?? "attention",
      title: a.title,
      desc: a.body ?? a.title,
    })),
    ...agings.map((g) => ({
      level: toneLevel(g.tone),
      tag: g.label ?? "aging",
      title: g.label ? `${g.label}：${g.value ?? ""}` : g.title,
      desc: g.caption ?? g.title,
    })),
  ];
}
