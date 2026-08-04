import { decisionRepo, signalRepo, timelineEventRepo } from "@/lib/db";

/** 每类最多注入的条数，控制注入 LLM 的历史体量。 */
const MAX_ITEMS = 5;

/**
 * 构建注入 LLM 的紧凑个人史摘要（仅供参考、不得据此下结论）。
 *
 * 纯规则抽取：近期 decisions（问题+状态）、关键 signals（label=value(trend)[confidence]）、
 * 近期 timeline（标题）。历史仅进 LLM 请求体、不出服务端、不落日志明文。
 * 无任何数据时返回 `null`——调用方据此省略该 system 消息。
 */
export async function buildHistorySummary(
  userId: string,
): Promise<string | null> {
  const [decisions, signals, timeline] = await Promise.all([
    decisionRepo.listByUser(userId),
    signalRepo.listByUser(userId),
    timelineEventRepo.listByUser(userId),
  ]);

  const parts: string[] = [];
  if (decisions.length) {
    parts.push(
      `近期决策：${decisions
        .slice(0, MAX_ITEMS)
        .map((d) => `${d.question}(${d.status})`)
        .join("；")}`,
    );
  }
  if (signals.length) {
    parts.push(
      `关键信号：${signals
        .slice(0, MAX_ITEMS)
        .map(
          (s) =>
            `${s.label}=${s.value}${s.trend ? `(${s.trend})` : ""}[${s.confidence}]`,
        )
        .join("；")}`,
    );
  }
  if (timeline.length) {
    parts.push(
      `近期记录：${timeline
        .slice(0, MAX_ITEMS)
        .map((t) => t.title)
        .join("；")}`,
    );
  }

  if (!parts.length) return null;
  return `用户个人史（仅供参考、不得据此下结论）：\n${parts.join("\n")}`;
}
