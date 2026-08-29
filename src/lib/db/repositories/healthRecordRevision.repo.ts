import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "~prisma/client";

export interface CreateRevisionInput {
  recordId: string;
  /** 修正前 parsedValues 快照（append-only 留痕） */
  parsedValuesSnapshot: Prisma.InputJsonValue;
  /** 修正后 parsedValues（写入 HealthRecord.parsedValues 作 current 指针） */
  newParsedValues: Prisma.InputJsonValue;
  /** 修正摘要（哪些字段变了） */
  diffSummary?: string | null;
  /** 修正者 userId */
  correctedBy: string;
  /** 修正原因（用户输入） */
  reason?: string | null;
}

/**
 * 追加修正记录（append-only，Contract §14 provenance）+ 同步更新 Record.parsedValues（current 指针）
 * 事务保证：revision 必须与 Record.parsedValues 同步，不出现 revision 有但 current 未更新
 */
export async function create(input: CreateRevisionInput) {
  return prisma.$transaction(async (tx) => {
    const revision = await tx.healthRecordRevision.create({
      data: {
        recordId: input.recordId,
        parsedValuesSnapshot: input.parsedValuesSnapshot,
        diffSummary: input.diffSummary ?? null,
        correctedBy: input.correctedBy,
        reason: input.reason ?? null,
      },
    });
    // current 指针：HealthRecord.parsedValues 持有最新值
    await tx.healthRecord.update({
      where: { id: input.recordId },
      data: {
        parsedValues: input.newParsedValues as Prisma.InputJsonValue,
      },
    });
    return revision;
  });
}

/** 列出某 Record 的修正历史（append-only，最新在前） */
export async function listByRecord(recordId: string) {
  return prisma.healthRecordRevision.findMany({
    where: { recordId },
    orderBy: { correctedAt: "desc" },
  });
}
