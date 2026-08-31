import { z } from "zod";
import {
  aiStateSchema,
  changeTriggerSchema,
  decisionLifecycleSchema,
  healthContextStatusSchema,
  observationDirectionSchema,
  synthesisProvenanceSchema,
} from "@/lib/db/enums";
import type { Decision, DecisionEntry, DecisionSnapshot } from "~prisma/client";

/** 三源 Decision Brief 快照（对齐 App `types.ts` DecisionBrief） */
export const DecisionBriefDTO = z.object({
  yourHistory: z.array(z.string()),
  similarJourneys: z.object({ summary: z.string(), note: z.string() }),
  evidence: z.object({
    known: z.array(z.string()),
    uncertain: z.array(z.string()),
  }),
  questionsForClinician: z.array(z.string()),
});

/** append-only 时间线条目（详情附带；App 忽略额外字段不破坏契约）
 *  task-44 §28 加 direction（better/same/worse/not_sure，非必填）。 */
export const DecisionEntryDTO = z.object({
  id: z.string(),
  text: z.string(),
  lifecycleSnapshot: decisionLifecycleSchema,
  occurredAt: z.string(),
  kind: z.string().nullable().optional(),
  direction: observationDirectionSchema.nullable().optional(),
  synthesis: z.unknown().nullable().optional(),
});

/** App `types.ts` Decision（`updated ← updatedAt`；列表省 brief，详情含 brief+entries）
 *  task-43 新增字段（currentSnapshotId/healthContext/healthContextStatus/healthContextConfirmedAt/pendingRegenAt）
 *  全部可选 nullable，task-37/42 存量不破坏（R1/R11）。
 *  task-44 新增 nextCheckInAt/observeBaseline，同样可选 nullable，task-43 存量不破坏。 */
export const DecisionDTO = z.object({
  id: z.string(),
  question: z.string(),
  goal: z.string().nullable(),
  type: z.string().nullable(),
  topic: z.string().nullable(),
  topicSlug: z.string().nullable(),
  lifecycle: decisionLifecycleSchema,
  decisionKind: z.string().nullable(),
  outcome: z.string().nullable(),
  nextStep: z.string().nullable(),
  saved: z.boolean(),
  yourselfContext: z.string().nullable(),
  updated: z.string(),
  lastUserActivityAt: z.string(),
  freshnessCheckedAt: z.string().nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  brief: DecisionBriefDTO.optional(),
  // task-43 综合结果层
  currentSnapshotId: z.string().nullable().optional(),
  healthContext: z.unknown().nullable().optional(),
  healthContextStatus: healthContextStatusSchema.nullable().optional(),
  healthContextConfirmedAt: z.string().nullable().optional(),
  pendingRegenAt: z.string().nullable().optional(),
  // task-44 Observe / Learn（§27/§30）
  nextCheckInAt: z.string().nullable().optional(),
  observeBaseline: z
    .object({
      text: z.string(),
      baselineRecordId: z.string().optional().nullable(),
      freq: z.enum(["daily", "3days", "weekly", "2weeks", "monthly"]),
    })
    .nullable()
    .optional(),
});

/** 详情：Decision + append-only entries（App 只消费 Decision 字段，entries 为附加） */
export const DecisionDetailDTO = DecisionDTO.extend({
  entries: z.array(DecisionEntryDTO),
});

/** brief 存 JSON，可空/缺失；仅当存在时解析形状（P2 前为快照/占位） */
function toBrief(brief: unknown): z.infer<typeof DecisionBriefDTO> | undefined {
  if (brief == null) return undefined;
  return DecisionBriefDTO.parse(brief);
}

export function toDecisionDTO(
  row: Decision,
  opts: { withBrief: boolean },
): z.infer<typeof DecisionDTO> {
  return {
    id: row.id,
    question: row.question,
    goal: row.goal,
    type: row.type,
    topic: row.topic,
    topicSlug: row.topicSlug,
    lifecycle: decisionLifecycleSchema.parse(row.lifecycle),
    decisionKind: row.decisionKind,
    outcome: row.outcome,
    nextStep: row.nextStep,
    saved: row.saved,
    yourselfContext: row.yourselfContext,
    updated: row.updatedAt.toISOString(),
    lastUserActivityAt: row.lastUserActivityAt.toISOString(),
    freshnessCheckedAt: row.freshnessCheckedAt
      ? row.freshnessCheckedAt.toISOString()
      : null,
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    brief: opts.withBrief ? toBrief(row.brief) : undefined,
    // task-43 综合结果层
    currentSnapshotId: row.currentSnapshotId,
    healthContext: row.healthContext,
    healthContextStatus: row.healthContextStatus as z.infer<
      typeof healthContextStatusSchema
    > | null,
    healthContextConfirmedAt: row.healthContextConfirmedAt
      ? row.healthContextConfirmedAt.toISOString()
      : null,
    pendingRegenAt: row.pendingRegenAt
      ? row.pendingRegenAt.toISOString()
      : null,
    // task-44 Observe / Learn
    nextCheckInAt: row.nextCheckInAt ? row.nextCheckInAt.toISOString() : null,
    observeBaseline: (row.observeBaseline as z.infer<
      typeof DecisionDTO
    >["observeBaseline"]) ?? null,
  };
}

export function toEntryDTO(
  row: DecisionEntry,
): z.infer<typeof DecisionEntryDTO> {
  return {
    id: row.id,
    text: row.text,
    lifecycleSnapshot: decisionLifecycleSchema.parse(row.lifecycleSnapshot),
    occurredAt: row.occurredAt.toISOString(),
    kind: row.kind,
    direction:
      row.direction === null || row.direction === undefined
        ? null
        : (observationDirectionSchema.safeParse(row.direction).success
          ? (row.direction as z.infer<typeof observationDirectionSchema>)
          : null),
    synthesis: row.synthesis,
  };
}

// =============================================================================
// task-43 综合结果层 DTO（Contract §15/§23）
// =============================================================================

/** §15/§23 综合 Snapshot（Current/History 共用此 DTO） */
export const DecisionSnapshotDTO = z.object({
  id: z.string(),
  decisionId: z.string(),
  yourselfContextRef: z.unknown().nullable().optional(),
  sources: z.unknown().nullable().optional(),
  citations: z.unknown().nullable().optional(),
  synthesis: z.unknown().nullable().optional(),
  provenance: synthesisProvenanceSchema,
  changeTrigger: changeTriggerSchema,
  createdAt: z.string(),
  /** §23 人话原因（不露原始 trigger 值；LLM 生成，失败降级模板） */
  triggerHumanLabel: z.string().optional(),
});

export function toSnapshotDTO(
  row: DecisionSnapshot,
  opts: { triggerHumanLabel?: string } = {},
): z.infer<typeof DecisionSnapshotDTO> {
  return {
    id: row.id,
    decisionId: row.decisionId,
    yourselfContextRef: row.yourselfContextRef,
    sources: row.sources,
    citations: row.citations,
    synthesis: row.synthesis,
    provenance: synthesisProvenanceSchema.parse(row.provenance),
    changeTrigger: changeTriggerSchema.parse(row.changeTrigger),
    createdAt: row.createdAt.toISOString(),
    triggerHumanLabel: opts.triggerHumanLabel,
  };
}

/** §19/§20 Health Context（GET 返回预填、PUT 写入） */
export const HealthContextDTO = z.object({
  healthContext: z.unknown().nullable(),
  status: healthContextStatusSchema.nullable(),
  healthContextConfirmedAt: z.string().nullable().optional(),
});

/** §24–§26 AI 状态机五态（per-视角；rule-based，不依赖 LLM） */
export const AiStateDTO = z.object({
  yourself: aiStateSchema,
  others: aiStateSchema,
  science: aiStateSchema,
  /** STALE 时返回 pendingUntil（窗口到期时间）；其他状态 null */
  pendingUntil: z.string().nullable().optional(),
});

/** §25 三视角 Insufficient 文案 key（前端 i18n 解析） */
export const INSUFFICIENT_PERSPECTIVE_KEYS = {
  yourself: "aiState.insufficient.yourself",
  others: "aiState.insufficient.others",
  science: "aiState.insufficient.science",
} as const;
