import {
  assertOutcomeForKind,
  type ChangeTrigger,
  changeTriggerSchema,
  type DecisionKind,
  type DecisionLifecycle,
  type DecisionOutcome,
  type DecisionType,
  decisionKindSchema,
  decisionTypeSchema,
  type HealthContextStatus,
  healthContextStatusSchema,
  type SynthesisProvenance,
  synthesisProvenanceSchema,
  type TopicSlug,
  topicSlugSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Decision } from "~prisma/client";
import { Prisma } from "~prisma/client";

/** §31 幂等去重窗口（同 userId+question 复用），常量便于调整 */
export const CREATE_DEDUP_WINDOW_MS = 60_000;

/**
 * task-43 D6 合并窗口：新相关 Record 连入时 pendingRegenAt 续期到 now + N min。
 * N=5min（可调）；窗口未过 → STALE_UPDATE_AVAILABLE；窗口过 → lazy fire regeneration。
 */
export const REGEN_DEBOUNCE_MINUTES = 5;

/** 四源 brief 快照（P1 存 JSON，结构对齐 App DecisionBrief） */
export interface DecisionBriefSnapshot {
  yourHistory: string[];
  similarJourneys: { summary: string; note: string };
  evidence: { known: string[]; uncertain: string[] };
  questionsForClinician: string[];
}

export interface CreateDecisionInput {
  question: string;
  /** 该决策服务的目标（对齐 concern_goals 词汇；Slice 1 起可选） */
  goal?: string | null;
  /** 缺省 ACTIVE（§5） */
  lifecycle?: DecisionLifecycle;
  /** Type A/B（缺省 unconfirmed，§3） */
  decisionKind?: DecisionKind | null;
  /** 按 kind 分组的 outcome（可空=未决） */
  outcome?: DecisionOutcome | null;
  /** Type B decided_on_next_step 必带 */
  nextStep?: string | null;
  /** 粗粒度决策种类（缺省 not_sure） */
  type?: DecisionType | null;
  /** 决策针对的实体/主题（自由文本） */
  topic?: string | null;
  /** topic 归一化 slug（驱动语料检索；须在已知集内） */
  topicSlug?: TopicSlug | null;
  brief?: DecisionBriefSnapshot | null;
}

export interface UpdateDecisionInput {
  question?: string;
  lifecycle?: DecisionLifecycle;
  decisionKind?: DecisionKind | null;
  outcome?: DecisionOutcome | null;
  nextStep?: string | null;
  type?: DecisionType | null;
  topic?: string | null;
  topicSlug?: TopicSlug | null;
  /** Keep this 置 true；Not-now 不置（保持 false）—— §11 纯书签 */
  saved?: boolean;
  /** Yourself 轻量文字背景（可编辑，随 Keep 一并保存；不写入 brief） */
  yourselfContext?: string | null;
  brief?: DecisionBriefSnapshot | null;
  decidedAt?: Date | null;
  /** §6 freshness gate 时间戳；仅 /check-freshness 端点写，通用 PATCH 不写 */
  freshnessCheckedAt?: Date | null;
}

/** §8 meaningful activity：写入这些字段才刷新 lastUserActivityAt（saved/brief/decidedAt 不算） */
const MEANINGFUL_UPDATE_KEYS = [
  "question",
  "type",
  "topic",
  "topicSlug",
  "yourselfContext",
  "decisionKind",
  "outcome",
  "nextStep",
  "lifecycle",
] as const;

function validateType(t?: DecisionType | null): void {
  if (t !== undefined && t !== null) decisionTypeSchema.parse(t);
}
function validateTopicSlug(s?: TopicSlug | null): void {
  if (s !== undefined && s !== null) topicSlugSchema.parse(s);
}
function validateKindOutcome(
  kind?: DecisionKind | null,
  outcome?: DecisionOutcome | null,
): void {
  if (kind != null) decisionKindSchema.parse(kind);
  if (outcome !== undefined) {
    // outcome 合法性依赖 kind；kind 未给时按 unconfirmed 兜底校验
    assertOutcomeForKind(kind ?? "unconfirmed", outcome);
  }
}

export async function create(
  userId: string,
  input: CreateDecisionInput,
): Promise<Decision> {
  validateType(input.type);
  validateTopicSlug(input.topicSlug);
  validateKindOutcome(input.decisionKind, input.outcome);

  // §31：60s 内同 userId+question 的重复创建 → 返回既有行，不新建
  const since = new Date(Date.now() - CREATE_DEDUP_WINDOW_MS);
  const dup = await prisma.decision.findFirst({
    where: { userId, question: input.question, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  if (dup) return dup;

  return prisma.decision.create({
    data: {
      userId,
      question: input.question,
      goal: input.goal ?? null,
      lifecycle: input.lifecycle ?? "ACTIVE",
      decisionKind: input.decisionKind ?? "unconfirmed",
      outcome: input.outcome ?? null,
      nextStep: input.nextStep ?? null,
      type: input.type ?? "not_sure",
      topic: input.topic ?? null,
      topicSlug: input.topicSlug ?? null,
      brief: (input.brief ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function update(
  id: string,
  input: UpdateDecisionInput,
): Promise<Decision> {
  validateType(input.type);
  validateTopicSlug(input.topicSlug);
  validateKindOutcome(input.decisionKind, input.outcome);
  const { brief, ...rest } = input;
  const touched = MEANINGFUL_UPDATE_KEYS.some((k) => input[k] !== undefined);
  return prisma.decision.update({
    where: { id },
    data: {
      ...rest,
      ...(touched ? { lastUserActivityAt: new Date() } : {}),
      brief:
        brief === undefined
          ? undefined
          : (brief as unknown as Prisma.InputJsonValue),
    },
  });
}

export async function listByUser(userId: string): Promise<Decision[]> {
  return prisma.decision.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

/** Actionable：lifecycle ∉ {CLOSED, COMPLETED}（§6），按最近活动倒序（§8） */
export async function listByUserActionable(
  userId: string,
): Promise<Decision[]> {
  return prisma.decision.findMany({
    where: { userId, lifecycle: { notIn: ["CLOSED", "COMPLETED"] } },
    orderBy: { lastUserActivityAt: "desc" },
  });
}

/** History：Closed/Completed（列表 UI 消费在 task-40） */
export async function listByUserHistory(userId: string): Promise<Decision[]> {
  return prisma.decision.findMany({
    where: { userId, lifecycle: { in: ["CLOSED", "COMPLETED"] } },
    orderBy: { lastUserActivityAt: "desc" },
  });
}

/** 新增 Observation 等外部 meaningful activity 时刷新排序键（§8） */
export async function bumpActivity(id: string): Promise<void> {
  await prisma.decision.update({
    where: { id },
    data: { lastUserActivityAt: new Date() },
  });
}

export async function findById(id: string): Promise<Decision | null> {
  return prisma.decision.findUnique({ where: { id } });
}

/**
 * D3/D6 Reopen 原子事务：归档 entry + 清空 outcome/nextStep + 置 ACTIVE。
 * 前置条件（ownership + lifecycle=CLOSED）由 route 预检；此处只做事务，
 * 事务内重新 findUniqueOrThrow 保证原子性（避免 read-then-write 竞态）。
 * D6：**不写 freshnessCheckedAt**（仅 /check-freshness 端点写）。
 */
export async function reopenAtomic(
  id: string,
  userId: string,
): Promise<Decision> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.decision.findUniqueOrThrow({ where: { id } });

    // D3：结构化归档 entry；synthesis 含原 outcome/nextStep + brief 深拷贝（若有）
    const synthesis: Record<string, unknown> = {
      outcome: existing.outcome,
      nextStep: existing.nextStep,
    };
    if (existing.brief != null) {
      synthesis.brief = existing.brief;
    }

    await tx.decisionEntry.create({
      data: {
        decisionId: id,
        userId,
        text: `Archived: ${existing.outcome ?? "undecided"}${existing.nextStep ? ` — ${existing.nextStep}` : ""}`,
        lifecycleSnapshot: "CLOSED",
        kind: "archived_outcome",
        synthesis: synthesis as Prisma.InputJsonValue,
        occurredAt: new Date(),
      },
    });

    // D6：清空 outcome/nextStep/decidedAt + 置 ACTIVE；不写 freshnessCheckedAt
    return tx.decision.update({
      where: { id },
      data: {
        outcome: null,
        nextStep: null,
        decidedAt: null,
        lifecycle: "ACTIVE",
        lastUserActivityAt: new Date(),
      },
    });
  });
}

/** 详情：含 append-only entries（时间正序） */
export async function findByIdWithEntries(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: { entries: { orderBy: { occurredAt: "asc" } } },
  });
}

// ============================================================================
// task-43 综合结果层（Contract §15–§26）
// Health Context 5 类结构化（§19/§20/D5）+ pending regen 合并窗口（§18/D6）
// + currentSnapshot 指针绑定（§15/D3）。
// 所有方法均为 meaningful activity（§8），写 lastUserActivityAt。
// ============================================================================

export interface UpdateHealthContextInput {
  /** §19 Yourself 结构化 5 类 JSON（symptoms/medications_treatments/...）
   *  传 Prisma.JsonNull 显式置 null；传 undefined 不更新该字段 */
  healthContext?:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null
    | undefined;
  /** §20 confirmed|unconfirmed；转 confirmed 刷 confirmedAt */
  status?: HealthContextStatus;
}

/**
 * §19/§20/D5 写 health_context + health_context_status。
 * - status 转 confirmed → 刷 health_context_confirmed_at（§20）
 * - 永不自动从 unconfirmed 转 confirmed（§20）
 * - 更新属 meaningful activity，刷 lastUserActivityAt（§8）
 * 扁平 yourselfContext 保留作 task-42 B2 fallback（综合时优先 healthContext）。
 */
export async function updateHealthContext(
  decisionId: string,
  input: UpdateHealthContextInput,
): Promise<Decision> {
  if (input.status !== undefined) {
    healthContextStatusSchema.parse(input.status);
  }
  const confirmedAt = input.status === "confirmed" ? new Date() : undefined;
  return prisma.decision.update({
    where: { id: decisionId },
    data: {
      ...(input.healthContext !== undefined
        ? {
            healthContext: input.healthContext as
              | Prisma.InputJsonValue
              | Prisma.NullableJsonNullValueInput,
          }
        : {}),
      ...(input.status !== undefined
        ? { healthContextStatus: input.status }
        : {}),
      ...(confirmedAt ? { healthContextConfirmedAt: confirmedAt } : {}),
      lastUserActivityAt: new Date(),
    },
  });
}

/**
 * §18/D6 续期 pendingRegenAt 到 now + REGEN_DEBOUNCE_MINUTES。
 * 已有 pending → 续期（不重置为新窗口的语义，而是延后到期时间，避免短时间多 Record 各自开窗口）。
 * 调用时机：新相关 Record 连入（orchestrator.onRecordConnected）。
 */
export async function touchPendingRegen(
  decisionId: string,
  minutes: number = REGEN_DEBOUNCE_MINUTES,
): Promise<Decision> {
  const expiresAt = new Date(Date.now() + minutes * 60_000);
  return prisma.decision.update({
    where: { id: decisionId },
    data: { pendingRegenAt: expiresAt },
  });
}

/** §18/D6 清空 pendingRegenAt（regeneration 完成或非 material 后调用） */
export async function clearPendingRegen(decisionId: string): Promise<Decision> {
  return prisma.decision.update({
    where: { id: decisionId },
    data: { pendingRegenAt: null },
  });
}

/** §18/D6 读 pendingRegenAt；null = 无 pending（READY） */
export async function getPendingRegen(
  decisionId: string,
): Promise<Date | null> {
  const row = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: { pendingRegenAt: true },
  });
  return row?.pendingRegenAt ?? null;
}

/**
 * §15/D3 绑定 currentSnapshotId + 清空 pendingRegenAt。
 * **应在事务内与 decisionSnapshotRepo.create 一起调用**，保证 Snapshot 创建 + 指针更新原子。
 * （orchestrator 用 $transaction 包，此处单独方法便于复用/单测。）
 */
export async function bindCurrentSnapshot(
  decisionId: string,
  snapshotId: string,
): Promise<Decision> {
  return prisma.decision.update({
    where: { id: decisionId },
    data: {
      currentSnapshotId: snapshotId,
      pendingRegenAt: null,
    },
  });
}

// 导出 task-43 枚举类型/Schema，便于上层 repo/route 复用
export type { ChangeTrigger, SynthesisProvenance };
