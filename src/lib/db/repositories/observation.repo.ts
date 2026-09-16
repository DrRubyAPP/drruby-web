import { prisma } from "@/lib/db/prisma";

export async function create(input: {
  userId: string;
  decisionId?: string | null;
  title: string;
  cadence?: string | null;
}) {
  return prisma.observation.create({
    data: {
      userId: input.userId,
      decisionId: input.decisionId ?? null,
      title: input.title,
      cadence: input.cadence ?? null,
    },
  });
}

/**
 * Starts the curated skin-condition tracker and records that start in My
 * Health. These writes describe one member action, so they commit together:
 * an Observation plan, its qualitative symptom HealthRecord, the explicit
 * Decision ⇄ HealthRecord link, and the timeline event.
 */
export async function createSkinConditionTracking(input: {
  userId: string;
  decisionId: string;
  cadence: string;
}) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const observation = await tx.observation.create({
      data: {
        userId: input.userId,
        decisionId: input.decisionId,
        title: "Skin condition",
        cadence: input.cadence,
      },
    });
    const source = await tx.healthSource.create({
      data: {
        userId: input.userId,
        fileName: "Skin condition observation started",
      },
    });
    const healthRecord = await tx.healthRecord.create({
      data: {
        userId: input.userId,
        sourceId: source.id,
        kind: "symptom",
        observationId: observation.id,
        metricCode: "skin_condition",
        title: "Skin condition observation started",
        parsedValues: {
          cadence: input.cadence,
          valueType: "qualitative",
        },
        recordedAt: now,
        status: "CONFIRMED",
        ocrStatus: "manual",
      },
    });
    await tx.decisionHealthRecord.create({
      data: {
        decisionId: input.decisionId,
        healthRecordId: healthRecord.id,
        connectedBy: "assistant",
      },
    });
    await tx.decision.update({
      where: { id: input.decisionId },
      data: { lastUserActivityAt: now },
    });
    await tx.timelineEvent.create({
      data: {
        userId: input.userId,
        decisionId: input.decisionId,
        kind: "note",
        importance: "minor",
        title: "Started observing Skin condition",
        source: "you",
        occurredAt: now,
      },
    });
    return { observation, healthRecord };
  });
}

export async function listByUser(userId: string) {
  return prisma.observation.findMany({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}

const CADENCE_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Active observation plans whose newest collected HealthRecord is overdue.
 * `recordedAt` represents when the metric was measured, so it deliberately
 * drives freshness rather than the record's creation time. Plans with an
 * unsupported/custom cadence are skipped until an explicit interval exists.
 */
export async function listDueByUser(userId: string, now = new Date()) {
  const observations = await prisma.observation.findMany({
    where: { userId, status: "active" },
    include: {
      decision: true,
      healthRecords: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  return observations
    .flatMap((observation) => {
      const interval = observation.cadence
        ? CADENCE_MS[observation.cadence]
        : undefined;
      if (!interval) return [];
      const latestAt = observation.healthRecords[0]?.recordedAt ?? observation.startedAt;
      const dueAt = new Date(latestAt.getTime() + interval);
      return dueAt <= now ? [{ ...observation, dueAt }] : [];
    })
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

/** Uses the same latest-record-plus-cadence rule as What Matters Now. */
export async function findDueByDecision(
  userId: string,
  decisionId: string,
  now = new Date(),
) {
  return (await listDueByUser(userId, now)).find(
    (observation) => observation.decisionId === decisionId,
  );
}
