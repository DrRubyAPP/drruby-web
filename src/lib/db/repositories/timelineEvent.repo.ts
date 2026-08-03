import { type TimelineKind, timelineKindSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { TimelineEvent } from "~prisma/client";

export interface CreateTimelineEventInput {
  kind: TimelineKind;
  title: string;
  detail?: string | null;
  source?: string | null;
  decisionId?: string | null;
  occurredAt: Date;
}

export async function create(
  userId: string,
  input: CreateTimelineEventInput,
): Promise<TimelineEvent> {
  timelineKindSchema.parse(input.kind);
  return prisma.timelineEvent.create({ data: { userId, ...input } });
}

/** 按用户列出，最新在前 */
export async function listByUser(userId: string): Promise<TimelineEvent[]> {
  return prisma.timelineEvent.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
  });
}

/** 某决策关联的时间线（正序） */
export async function listByDecision(
  decisionId: string,
): Promise<TimelineEvent[]> {
  return prisma.timelineEvent.findMany({
    where: { decisionId },
    orderBy: { occurredAt: "asc" },
  });
}
