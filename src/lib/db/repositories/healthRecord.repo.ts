import {
  type HealthRecordKind,
  healthRecordKindSchema,
  type OcrStatus,
  ocrStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { HealthRecord, Prisma } from "~prisma/client";

export interface CreateHealthRecordInput {
  kind: HealthRecordKind;
  title: string;
  source?: string | null;
  objectKey?: string | null;
  /** 默认 pending；本轮人工录入用 manual */
  ocrStatus?: OcrStatus;
  parsedValues?: Prisma.InputJsonValue | null;
  recordedAt: Date;
  /**
   * task-42 起必填：Record 层关联的 HealthSource 原件 id。
   * 若未传，repo 自动建一个 placeholder Source（用 title/objectKey 推断 fileName）。
   */
  sourceId?: string;
}

/**
 * task-42 起为 Record 层：必须挂在 HealthSource 下。
   旧调用方未传 sourceId 时自动建 placeholder Source，保持向后兼容。
 */
export async function create(
  userId: string,
  input: CreateHealthRecordInput,
): Promise<HealthRecord> {
  healthRecordKindSchema.parse(input.kind);
  if (input.ocrStatus !== undefined) ocrStatusSchema.parse(input.ocrStatus);

  // 若未传 sourceId，自动建 placeholder Source（task-42 兼容路径）
  let sourceId = input.sourceId;
  if (!sourceId) {
    const src = await prisma.healthSource.create({
      data: {
        userId,
        fileName: input.title,
        objectKey: input.objectKey ?? null,
      },
    });
    sourceId = src.id;
  }

  // task-42 状态机映射：手动录入（ocrStatus=manual/done）→ CONFIRMED；其他 → SOURCE_UPLOADED
  const ocrStatus = input.ocrStatus ?? "pending";
  const status =
    ocrStatus === "manual" || ocrStatus === "done"
      ? "CONFIRMED"
      : "SOURCE_UPLOADED";

  return prisma.healthRecord.create({
    data: {
      userId,
      sourceId,
      kind: input.kind,
      title: input.title,
      // 旧字段保留兼容（task-42 起由 HealthSource + status 替代）
      source: input.source ?? null,
      objectKey: input.objectKey ?? null,
      ocrStatus,
      status,
      parsedValues: (input.parsedValues ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      recordedAt: input.recordedAt,
    },
    include: { healthSource: true },
  });
}

/** 按 recordedAt 倒序列出某用户的健康报告 */
export async function listByUser(userId: string): Promise<HealthRecord[]> {
  return prisma.healthRecord.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    include: { healthSource: true },
  });
}

export async function findById(id: string): Promise<HealthRecord | null> {
  return prisma.healthRecord.findUnique({
    where: { id },
    include: { healthSource: true },
  });
}
