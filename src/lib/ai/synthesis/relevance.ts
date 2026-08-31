/**
 * task-43 D2 RelevanceEngine（Contract §16）
 *
 * 规则匹配：新信息与 Decision 的 topicSlug / healthContext 5 类 / topic
 * / 相关健康状态 / 正被观察结果之间存在直接关联时才相关。
 *
 * 反例：HRT Decision 遇不相关皮肤照片 → 不触发 regeneration（即便进了 My Health）。
 * 保守策略：不命中不触发，用户可手动触发刷新。
 *
 * 纯函数可单测；不依赖 LLM（D2）。
 */

import {
  TOPIC_DOCUMENT_CLASS_MAP,
  TOPIC_KIND_MAP,
} from "@/config/relevance-map";
import type { TopicSlug } from "@/lib/db/enums";
import { HEALTH_CONTEXT_CATEGORIES } from "@/lib/db/enums";
import type { ConnectedRecordRef, HealthContext } from "./types";

export interface DecisionRef {
  id: string;
  topicSlug?: TopicSlug | string | null;
  topic?: string | null;
  healthContext?: HealthContext | null;
  yourselfContext?: string | null;
}

/** 把字符串归一化（lowercase + trim）便于关键词匹配 */
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** 取 healthContext 5 类的非空字符串值（关键词池） */
function collectHealthContextKeywords(
  hc: HealthContext | null | undefined,
): string[] {
  if (!hc || typeof hc !== "object") return [];
  const out: string[] = [];
  for (const cat of HEALTH_CONTEXT_CATEGORIES) {
    const v = hc[cat];
    if (typeof v === "string" && v.trim()) {
      out.push(normalize(v));
    }
  }
  return out;
}

/**
 * 判定 Record 是否与 Decision 相关（D2）。
 *
 * 命中条件（任一）：
 * 1. Decision.topicSlug 在映射表内 + Record.documentClass 命中
 * 2. Decision.topicSlug 在映射表内 + Record.kind 命中
 * 3. healthContext 5 类关键词出现在 Record.summary 内（大小写不敏感）
 *
 * 无 topicSlug 且无关键词命中 → false（保守）
 */
export function isRelevant(
  record: ConnectedRecordRef,
  decision: DecisionRef,
): boolean {
  // (1)+(2) topicSlug 映射表
  if (decision.topicSlug) {
    const slug = decision.topicSlug as TopicSlug;
    const dcSet = TOPIC_DOCUMENT_CLASS_MAP[slug];
    const kindSet = TOPIC_KIND_MAP[slug];
    if (dcSet && record.documentClass && dcSet.has(record.documentClass)) {
      return true;
    }
    if (kindSet && record.kind && kindSet.has(record.kind)) {
      return true;
    }
  }

  // (3) healthContext 关键词命中 record.summary
  const summary = normalize(record.summary);
  if (!summary) return false;
  const keywords = collectHealthContextKeywords(decision.healthContext);
  for (const kw of keywords) {
    // 把 5 类的整段作为关键词池，按词匹配避免子串误命中
    const tokens = kw.split(/[\s,;]+/).filter((t) => t.length >= 4);
    if (tokens.length === 0) continue;
    // 至少一个 token 出现在 summary 内
    if (tokens.some((t) => summary.includes(t))) {
      return true;
    }
  }

  return false;
}
