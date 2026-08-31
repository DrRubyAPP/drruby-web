/**
 * task-43 §24–§26 AI 状态机五态计算（rule-based）
 *
 * Yourself / Others / Science 三视角各自独立判定（F6 表）：
 * - LOADING：regeneration 进行中（pendingRegenAt 已过、模板重组执行中）或首次 synthesis 生成中
 *   注：实际 LOADING 态由 route/orchestrator 在 fire 期间临时持有；本 helper 仅做规则判定
 * - READY：当前 synthesis 可用且 pendingRegenAt=null
 * - INSUFFICIENT_INFORMATION：无 connected Records 且 healthContext 空（Yourself）；
 *   topicSlug 无匹配语料（Others/Science）— §25 合法空态
 * - FAILED：regeneration 抛错 / LLM 失败 — §26 ≠ Insufficient，提供 Retry
 * - STALE_UPDATE_AVAILABLE：pendingRegenAt 非空（窗口未过）或 freshness check 发现潜在变化未 regen
 *
 * 注：FAILED 由调用方按 orchestrator 失败信号传入；本 helper 不直接判定 FAILED。
 */
import type { AiState } from "@/lib/db/enums";
import type { DecisionSnapshot } from "~prisma/client";

export interface AiStateInput {
  /** Decision.currentSnapshotId 是否存在（有 currentSnapshot 即 READY 候选） */
  hasCurrentSnapshot: boolean;
  /** Decision.pendingRegenAt（D6 合并窗口时间戳） */
  pendingRegenAt: Date | null;
  /** Decision.healthContext（结构化 5 类， Yourself INSUFFICIENT 判定用） */
  hasHealthContext: boolean;
  /** task-42 B2 fallback：扁平 yourselfContext 非空也算 Yourself 有内容 */
  hasYourselfContext: boolean;
  /** 是否有 connected Records（Yourself INSUFFICIENT 判定用） */
  hasConnectedRecords: boolean;
  /** topicSlug 是否命中语料（Others/Science INSUFFICIENT 判定用） */
  topicSlugHitCorpus: boolean;
  /** 上次 regen 是否失败（FAILED 判定；V1 默认 false） */
  lastRegenFailed: boolean;
}

export interface AiStateResult {
  yourself: AiState;
  others: AiState;
  science: AiState;
  /** STALE 时返回窗口到期时间；其他状态 null */
  pendingUntil: Date | null;
}

/**
 * 按 F6 表规则计算三视角五态。
 *
 * Yourself 视角：
 * - pendingRegenAt 非空（未过期或过期未 fire）→ STALE_UPDATE_AVAILABLE
 * - hasCurrentSnapshot + pendingRegenAt=null → READY
 * - 无 connected Records 且无 healthContext/yourselfContext → INSUFFICIENT_INFORMATION
 * - lastRegenFailed → FAILED
 *
 * Others/Science 视角（V1 静态语料，决策 B）：
 * - topicSlug 命中语料 → READY
 * - topicSlug 无匹配 → INSUFFICIENT_INFORMATION
 * - Yourself 有 pending 未 fire → STALE_UPDATE_AVAILABLE（B2：Yourself/Record 变化驱动）
 */
export function computeAiState(input: AiStateInput): AiStateResult {
  // FAILED 优先（§26：Failed ≠ Insufficient）
  if (input.lastRegenFailed) {
    return {
      yourself: "FAILED",
      others: "READY", // Others/Science 与 Yourself 失败解耦
      science: "READY",
      pendingUntil: input.pendingRegenAt,
    };
  }

  // STALE：pendingRegenAt 非空 → 全视角至少 Yourself STALE（B2）
  if (input.pendingRegenAt) {
    // 窗口未过期 → STALE；过期应由 lazy fire 触发后回 READY
    // 注：lazy fire 由 route 在 GET /decisions/[id] 调用 maybeFirePendingRegen 处理，
    // 此 helper 仅反映当前状态——pendingRegenAt 非空即 STALE。
    return {
      yourself: "STALE_UPDATE_AVAILABLE",
      others: "STALE_UPDATE_AVAILABLE",
      science: "STALE_UPDATE_AVAILABLE",
      pendingUntil: input.pendingRegenAt,
    };
  }

  // Yourself 视角
  let yourself: AiState;
  if (input.hasCurrentSnapshot) {
    yourself = "READY";
  } else if (
    !input.hasConnectedRecords &&
    !input.hasHealthContext &&
    !input.hasYourselfContext
  ) {
    yourself = "INSUFFICIENT_INFORMATION";
  } else {
    // 有内容但无 currentSnapshot（首次打开未 fire initial synthesis）→ LOADING
    yourself = "LOADING";
  }

  // Others/Science 视角（V1 静态语料）
  const others: AiState = input.topicSlugHitCorpus
    ? "READY"
    : "INSUFFICIENT_INFORMATION";
  const science: AiState = input.topicSlugHitCorpus
    ? "READY"
    : "INSUFFICIENT_INFORMATION";

  return {
    yourself,
    others,
    science,
    pendingUntil: null,
  };
}

/**
 * 取 Snapshot 的 triggerHumanLabel。
 * 若 Snapshot.yourselfContextRef 内含 trigger 文案（T4 LLM 生成），取之；否则返回 undefined。
 * 注：实际 triggerHumanLabel 在 SynthesisResult 内由 Synthesizer 生成；
 * Snapshot 表本身不存此字段（D1 文案运行时合成），此 helper 留作未来扩展。
 */
export function snapshotTriggerHumanLabel(
  _snapshot: DecisionSnapshot | null,
): string | undefined {
  // V1：triggerHumanLabel 不持久化（每次综合时由 Synthesizer 重新生成）；
  // route GET /snapshots 时返回 undefined，前端从 latest SynthesisResult 取或单独 GET。
  return undefined;
}
