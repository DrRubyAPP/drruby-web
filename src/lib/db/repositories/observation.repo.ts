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
        metricCode: "skin_condition",
        title: "Skin condition observation started",
        parsedValues: {
          observationId: observation.id,
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
