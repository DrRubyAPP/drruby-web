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
}

export async function create(
  userId: string,
  input: CreateHealthRecordInput,
): Promise<HealthRecord> {
  healthRecordKindSchema.parse(input.kind);
  if (input.ocrStatus !== undefined) ocrStatusSchema.parse(input.ocrStatus);
  return prisma.healthRecord.create({
    data: {
      userId,
      kind: input.kind,
      title: input.title,
      source: input.source ?? null,
      objectKey: input.objectKey ?? null,
      ocrStatus: input.ocrStatus ?? "pending",
      parsedValues: (input.parsedValues ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      recordedAt: input.recordedAt,
    },
  });
}

/** 按 recordedAt 倒序列出某用户的健康报告 */
export async function listByUser(userId: string): Promise<HealthRecord[]> {
  return prisma.healthRecord.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function findById(id: string): Promise<HealthRecord | null> {
  return prisma.healthRecord.findUnique({ where: { id } });
}
