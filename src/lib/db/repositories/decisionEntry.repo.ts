import {
  type DecisionLifecycle,
  decisionLifecycleSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { DecisionEntry } from "~prisma/client";
import { bumpActivity } from "./decision.repo";

export interface AppendEntryInput {
  decisionId: string;
  userId: string;
  text: string;
  lifecycleSnapshot: DecisionLifecycle;
  occurredAt: Date;
}

/** append-only：原始记录永不覆盖，仅新增（无 update/delete） */
export async function append(input: AppendEntryInput): Promise<DecisionEntry> {
  decisionLifecycleSchema.parse(input.lifecycleSnapshot);
  const entry = await prisma.decisionEntry.create({ data: input });
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
