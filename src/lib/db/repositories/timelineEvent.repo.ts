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

/**
 * 按用户列出，最新在前
 * task-50 D-2：默认过滤「关联 Decision 已软删」的事件（decisionId 为 null 的事件保留）。
 * P-2：includeDeletedDecisionEvents=true 供 /api/me/export 保留完整时间线（§14 provenance）。
 */
export async function listByUser(
  userId: string,
  opts: { includeDeletedDecisionEvents?: boolean } = {},
): Promise<TimelineEvent[]> {
  return prisma.timelineEvent.findMany({
    where: {
      userId,
      ...(opts.includeDeletedDecisionEvents
        ? {}
        : { OR: [{ decisionId: null }, { decision: { deletedAt: null } }] }),
    },
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
