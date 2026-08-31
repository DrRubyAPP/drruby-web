import {
  type DecisionEntryKind,
  type DecisionLifecycle,
  decisionEntryKindSchema,
  decisionLifecycleSchema,
  type ObservationDirection,
  observationDirectionSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { DecisionEntry } from "~prisma/client";
import { Prisma } from "~prisma/client";
import {
  bumpActivity,
  type CreateLearningInput,
  type CreateObservationInput,
  type UpdateObservationInput,
} from "./decision.repo";

export interface AppendEntryInput {
  decisionId: string;
  userId: string;
  text: string;
  lifecycleSnapshot: DecisionLifecycle;
  occurredAt: Date;
  /** §6 entry 类型；缺省/历史 = observation */
  kind?: DecisionEntryKind | null;
  /** §28 task-44 方向评级（仅 kind=observation 时有意义；非必填） */
  direction?: ObservationDirection | null;
  /** D3 归档 entry 的结构化 synthesis（V1 = brief 深拷贝 + outcome/nextStep） */
  synthesis?: unknown;
}

/** append-only：原始记录永不覆盖，仅新增（无 update/delete） */
export async function append(input: AppendEntryInput): Promise<DecisionEntry> {
  decisionLifecycleSchema.parse(input.lifecycleSnapshot);
  if (input.kind != null) decisionEntryKindSchema.parse(input.kind);
  if (input.direction != null)
    observationDirectionSchema.parse(input.direction);
  const { synthesis, direction, ...data } = input;
  const entry = await prisma.decisionEntry.create({
    data: {
      ...data,
      ...(direction !== undefined ? { direction } : {}),
      ...(synthesis !== undefined
        ? { synthesis: synthesis as Prisma.InputJsonValue }
        : {}),
    },
  });
  // 新增 Observation 属 §8 meaningful activity，刷新父 Decision 排序键
  await bumpActivity(input.decisionId);
  return entry;
}

export async function listByDecision(
  decisionId: string,
): Promise<DecisionEntry[]> {
  return prisma.decisionEntry.findMany({
    where: { decisionId },
    orderBy: { occurredAt: "asc" },
  });
}

/** §6 freshness gate：最近一次 archived_outcome entry（gate 校验的基准） */
export async function findLastArchivedEntry(
  decisionId: string,
): Promise<DecisionEntry | null> {
  return prisma.decisionEntry.findFirst({
    where: { decisionId, kind: "archived_outcome" },
    orderBy: { occurredAt: "desc" },
  });
}

// =============================================================================
// task-44 Observe / Learn（§28/§29）
// 所有方法均复用 Prisma $transaction 保证跨表原子；写入属 §8 meaningful
// activity，刷父 Decision.lastUserActivityAt。append-only 原则：observation
// 修正不改 occurredAt/createdAt（D8），Learning 每次重生成写新 entry（§14）。
// =============================================================================

/**
 * §28 新建 Observation + 顺延 nextCheckInAt（D6）+ 刷 lastUserActivityAt（§8）。
 * 不创建新 Decision（走专属端点 /api/decisions/[id]/observations）。
 */
export async function createObservation(
  input: CreateObservationInput,
): Promise<DecisionEntry> {
  if (input.direction != null)
    observationDirectionSchema.parse(input.direction);
  const now = input.occurredAt ?? new Date();
  return prisma.$transaction(async (tx) => {
    // 1. 写 observation entry（append-only）
    const entry = await tx.decisionEntry.create({
      data: {
        decisionId: input.decisionId,
        userId: input.userId,
        text: input.text,
        lifecycleSnapshot: "OBSERVING",
        kind: "observation",
        direction: input.direction ?? null,
        ...(input.synthesis !== undefined
          ? {
              synthesis: input.synthesis as unknown as Prisma.InputJsonValue,
            }
          : {}),
        occurredAt: now,
        createdAt: now,
      },
    });
    // 2. 顺延 nextCheckInAt（按 observeBaseline.freq 推算；无 freq 则不写）
    const decision = await tx.decision.findUnique({
      where: { id: input.decisionId },
      select: { observeBaseline: true },
    });
    const freq = (decision?.observeBaseline as { freq?: string } | null)?.freq;
    if (freq) {
      const ms =
        freq === "daily"
          ? 24 * 60 * 60 * 1000
          : freq === "3days"
            ? 3 * 24 * 60 * 60 * 1000
            : freq === "weekly"
              ? 7 * 24 * 60 * 60 * 1000
              : freq === "2weeks"
                ? 14 * 24 * 60 * 60 * 1000
                : freq === "monthly"
                  ? 30 * 24 * 60 * 60 * 1000
                  : 7 * 24 * 60 * 60 * 1000; // 兜底 weekly
      await tx.decision.update({
        where: { id: input.decisionId },
        data: {
          nextCheckInAt: new Date(now.getTime() + ms),
          lastUserActivityAt: now,
        },
      });
    } else {
      // 无 freq 也刷 activity
      await tx.decision.update({
        where: { id: input.decisionId },
        data: { lastUserActivityAt: now },
      });
    }
    return entry;
  });
}

/**
 * §28/D8 修正 Observation：append-only 原则下保留 occurredAt/createdAt 不变。
 * 仅更新 direction/text/synthesis；修正属 meaningful activity，刷 lastUserActivityAt。
 */
export async function updateObservation(
  input: UpdateObservationInput,
): Promise<DecisionEntry> {
  if (input.direction != null && input.direction !== null) {
    observationDirectionSchema.parse(input.direction);
  }
  const now = new Date();
  // 先 findUnique 取 decisionId + 校验 ownership（entry.userId === input.userId）
  const existing = await prisma.decisionEntry.findUnique({
    where: { id: input.entryId },
    select: { userId: true, decisionId: true },
  });
  if (!existing) throw new Error("observation entry not found");
  if (existing.userId !== input.userId) throw new Error("forbidden");

  const entry = await prisma.decisionEntry.update({
    where: { id: input.entryId },
    data: {
      ...(input.text !== undefined && { text: input.text }),
      ...(input.direction !== undefined && { direction: input.direction }),
      ...(input.synthesis !== undefined
        ? {
            synthesis:
              input.synthesis === null
                ? Prisma.JsonNull
                : (input.synthesis as unknown as Prisma.InputJsonValue),
          }
        : {}),
    },
  });
  // 修正属 meaningful activity，刷父 Decision lastUserActivityAt
  await prisma.decision.update({
    where: { id: existing.decisionId },
    data: { lastUserActivityAt: now },
  });
  return entry;
}

/**
 * §29 写 kind=learning entry（append-only，每次重生成写新 entry 不覆盖旧）。
 * synthesis 承载 { text, supportingObservationIds, generatedAt }（§14 历史溯源）。
 */
export async function createLearning(
  input: CreateLearningInput,
): Promise<DecisionEntry> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const entry = await tx.decisionEntry.create({
      data: {
        decisionId: input.decisionId,
        userId: input.userId,
        text: input.text,
        lifecycleSnapshot: "LEARNING",
        kind: "learning",
        synthesis: {
          text: input.text,
          supportingObservationIds: input.supportingObservationIds,
          generatedAt: now.toISOString(),
        } as Prisma.InputJsonValue,
        occurredAt: now,
        createdAt: now,
      },
    });
    // Learning 写入属 §8 meaningful activity
    await tx.decision.update({
      where: { id: input.decisionId },
      data: { lastUserActivityAt: now },
    });
    return entry;
  });
}

/** 按 kind 过滤列表（observation/learning；learning 按 occurredAt DESC 倒序） */
export async function listByDecisionAndKind(
  decisionId: string,
  kind: "observation" | "learning",
): Promise<DecisionEntry[]> {
  return prisma.decisionEntry.findMany({
    where: { decisionId, kind },
    orderBy: { occurredAt: kind === "learning" ? "desc" : "asc" },
  });
}
