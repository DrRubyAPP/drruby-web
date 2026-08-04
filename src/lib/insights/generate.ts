import "server-only";
import {
  bodyInsightRepo,
  decisionRepo,
  signalRepo,
  timelineEventRepo,
} from "@/lib/db";
import { type LlmClient, openAiClient } from "@/lib/llm/client";
import { computeAgingVelocity, computeAttention } from "./rules";

/** 润色前后的最小文案单元（只碰 title/body，数值/枚举不经 LLM）。 */
interface PolishItem {
  title: string;
  body?: string | null;
}

/**
 * 用 LLM **仅润色** title/body，保持数量与顺序一一对应。
 * 缺 key、无内容、上游失败或返回结构不符 → 原样返回（降级不阻断数值产出）。
 */
async function polish(
  items: PolishItem[],
  llm: LlmClient,
): Promise<PolishItem[]> {
  if (!llm.isConfigured() || items.length === 0) return items;
  try {
    const prompt =
      "以下是给女性健康决策助手用户的提示卡文案。请在不新增结论、不诊断、" +
      "保留不确定性、非指令性的前提下，把每条 title/body 润色得更平和清晰。" +
      "严格逐条对应、数量不变，返回 JSON 数组，每项含键 title、body：\n" +
      JSON.stringify(items);
    const raw = await llm.chatComplete([{ role: "user", content: prompt }]);
    const parsed = JSON.parse(raw) as PolishItem[];
    if (!Array.isArray(parsed) || parsed.length !== items.length) return items;
    // 只接受字符串 title；body 缺失回退原文，杜绝 LLM 结构漂移污染。
    return items.map((orig, i) => {
      const p = parsed[i];
      const title = typeof p?.title === "string" ? p.title : orig.title;
      const body = typeof p?.body === "string" ? p.body : orig.body;
      return { title, body };
    });
  } catch {
    return items; // 降级：润色失败不影响数值/枚举产出
  }
}

/**
 * 生成并**替换**当前用户的 attention + aging_velocity 洞察。
 *
 * 流程：并行取数 → 规则算数值/置信/accent/tone → LLM 仅润色 attention 文案（可降级）→
 * 幂等替换写入两个 kind。返回各 kind 写入条数。
 *
 * @param userId 目标用户
 * @param deps.llm 可注入的 LLM client（单测注入 fake；默认生产 openAiClient）
 */
export async function generateBodyInsights(
  userId: string,
  deps: { llm?: LlmClient } = {},
): Promise<{ attention: number; agingVelocity: number }> {
  const llm = deps.llm ?? openAiClient;

  const [signals, timeline, decisions] = await Promise.all([
    signalRepo.listByUser(userId),
    timelineEventRepo.listByUser(userId),
    decisionRepo.listByUser(userId),
  ]);
  const data = { signals, timeline, decisions };

  const attention = computeAttention(data);
  const polished = await polish(
    attention.map((a) => ({ title: a.title, body: a.body })),
    llm,
  );
  attention.forEach((a, i) => {
    a.title = polished[i].title;
    a.body = polished[i].body;
  });

  const aging = computeAgingVelocity(data);

  const attentionCount = await bodyInsightRepo.replaceByUserAndKind(
    userId,
    "attention",
    attention,
  );
  const agingCount = await bodyInsightRepo.replaceByUserAndKind(
    userId,
    "aging_velocity",
    aging,
  );

  return { attention: attentionCount, agingVelocity: agingCount };
}
