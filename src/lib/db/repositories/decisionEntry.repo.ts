import {
  type DecisionEntryKind,
  type DecisionLifecycle,
  decisionEntryKindSchema,
  decisionLifecycleSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { DecisionEntry, Prisma } from "~prisma/client";
import { bumpActivity } from "./decision.repo";

export interface AppendEntryInput {
  decisionId: string;
  userId: string;
  text: string;
  lifecycleSnapshot: DecisionLifecycle;
  occurredAt: Date;
  /** §6 entry 类型；缺省/历史 = observation */
  kind?: DecisionEntryKind | null;
  /** D3 归档 entry 的结构化 synthesis（V1 = brief 深拷贝 + outcome/nextStep） */
  synthesis?: unknown;
}

/** append-only：原始记录永不覆盖，仅新增（无 update/delete） */
export async function append(input: AppendEntryInput): Promise<DecisionEntry> {
  decisionLifecycleSchema.parse(input.lifecycleSnapshot);
  if (input.kind != null) decisionEntryKindSchema.parse(input.kind);
  const { synthesis, ...data } = input;
  const entry = await prisma.decisionEntry.create({
    data: {
      ...data,
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
