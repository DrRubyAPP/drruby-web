import { type DecisionStatus, decisionStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { DecisionEntry } from "~prisma/client";

export interface AppendEntryInput {
  decisionId: string;
  userId: string;
  text: string;
  statusSnapshot: DecisionStatus;
  occurredAt: Date;
}

/** append-only：原始记录永不覆盖，仅新增（无 update/delete） */
export async function append(input: AppendEntryInput): Promise<DecisionEntry> {
  decisionStatusSchema.parse(input.statusSnapshot);
  return prisma.decisionEntry.create({ data: input });
}

export async function listByDecision(
  decisionId: string,
): Promise<DecisionEntry[]> {
  return prisma.decisionEntry.findMany({
    where: { decisionId },
    orderBy: { occurredAt: "asc" },
  });
}
