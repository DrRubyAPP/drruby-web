import { prisma } from "@/lib/db/prisma";

/**
 * 显式 Connect：Decision ⇄ HealthRecord 关联（Contract §2）
 * 软删除留痕：removedAt 非空表示已移除（C9）；listByDecision 只返回 removedAt=null
 * 刷 lastUserActivityAt：Connect 属 meaningful activity（§8，影响 WMN 排序）
 */
export async function connect(
  decisionId: string,
  healthRecordId: string,
  connectedBy: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.decisionHealthRecord.create({
      data: { decisionId, healthRecordId, connectedBy },
    });
    await tx.decision.update({
      where: { id: decisionId },
      data: { lastUserActivityAt: new Date() },
    });
  });
}

/**
 * 软删除留痕（C9）+ 刷 lastUserActivityAt
 * 不实际 DELETE，仅置 removedAt；listByDecision 过滤 removedAt=null
 */
export async function disconnect(
  decisionId: string,
  healthRecordId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.decisionHealthRecord.updateMany({
      where: { decisionId, healthRecordId, removedAt: null },
      data: { removedAt: new Date() },
    });
    await tx.decision.update({
      where: { id: decisionId },
      data: { lastUserActivityAt: new Date() },
    });
  });
}

/** 列出 Decision 的 active 关联（removedAt: null，含 healthRecord + healthSource） */
export async function listByDecision(decisionId: string) {
  return prisma.decisionHealthRecord.findMany({
    where: { decisionId, removedAt: null },
    include: {
      healthRecord: { include: { healthSource: true } },
    },
    orderBy: { connectedAt: "desc" },
  });
}
