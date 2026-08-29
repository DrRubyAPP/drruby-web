import {
  type DocumentClass,
  documentClassSchema,
  type ExtractionConfidence,
  extractionConfidenceSchema,
  type HealthRecordKind,
  type HealthRecordStatus,
  healthRecordKindSchema,
  healthRecordStatusSchema,
  type OcrStatus,
  ocrStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { HealthRecord, Prisma } from "~prisma/client";

export type HealthRecordWithProvenance = Prisma.HealthRecordGetPayload<{
  include: {
    healthSource: true;
    revisions: { orderBy: { correctedAt: "desc" } };
  };
}>;

export type HealthRecordWithSource = Prisma.HealthRecordGetPayload<{
  include: { healthSource: true };
}>;

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
  /** task-42：documentClass（Lab/Imaging/Pathology/...） */
  documentClass?: DocumentClass | null;
  /** task-42：状态机起点，默认 SOURCE_UPLOADED；手动录入可传 CONFIRMED */
  status?: HealthRecordStatus;
  /** task-42：抽取置信（High/Low/Unrecognized/Conflicting） */
  confidence?: ExtractionConfidence | null;
}

/**
 * task-42 起为 Record 层：必须挂在 HealthSource 下。
   旧调用方未传 sourceId 时自动建 placeholder Source，保持向后兼容。
 */
export async function create(
  userId: string,
  input: CreateHealthRecordInput,
): Promise<HealthRecordWithSource> {
  healthRecordKindSchema.parse(input.kind);
  if (input.ocrStatus !== undefined) ocrStatusSchema.parse(input.ocrStatus);
  if (input.status) healthRecordStatusSchema.parse(input.status);
  if (input.documentClass) documentClassSchema.parse(input.documentClass);
  if (input.confidence) extractionConfidenceSchema.parse(input.confidence);

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
    input.status ??
    (ocrStatus === "manual" || ocrStatus === "done"
      ? "CONFIRMED"
      : "SOURCE_UPLOADED");

  return prisma.healthRecord.create({
    data: {
      userId,
      sourceId,
      kind: input.kind,
      title: input.title,
      documentClass: input.documentClass ?? null,
      status,
      confidence: input.confidence ?? null,
      // 旧字段保留兼容（task-42 起由 HealthSource + status 替代）
      source: input.source ?? null,
      objectKey: input.objectKey ?? null,
      ocrStatus,
      parsedValues: (input.parsedValues ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      recordedAt: input.recordedAt,
    },
    include: { healthSource: true },
  });
}

/** 按 recordedAt 倒序列出某用户的健康记录（含 healthSource） */
export async function listByUser(
  userId: string,
): Promise<HealthRecordWithSource[]> {
  return prisma.healthRecord.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    include: { healthSource: true },
  });
}

/**
 * 单个健康记录详情（含原件 + 修正历史，provenance 可追溯）
 * revisions 按 correctedAt 倒序（最新修正在前）
 */
export async function findById(
  id: string,
): Promise<HealthRecordWithProvenance | null> {
  return prisma.healthRecord.findUnique({
    where: { id },
    include: {
      healthSource: true,
      revisions: { orderBy: { correctedAt: "desc" } },
    },
  });
}

/**
 * 推进状态机（Contract §12）：SOURCE_UPLOADED→PROCESSING→EXTRACTED_DRAFT→USER_REVIEW→CONFIRMED
 * 不做合法性校验（调用方负责），仅做枚举 parse 防错。
 */
export async function advanceStatus(
  recordId: string,
  next: HealthRecordStatus,
): Promise<HealthRecord> {
  healthRecordStatusSchema.parse(next);
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: { status: next },
  });
}

/**
 * 更新抽取结果（mock Extractor 返回后写入；Contract §13）
 * 不走 append-only（append-only 仅用于用户纠错 → HealthRecordRevision）；
 * Extractor 输出是机器初值，可被下一次抽取覆盖。
 */
export async function updateExtraction(
  recordId: string,
  input: {
    status?: HealthRecordStatus;
    confidence?: ExtractionConfidence | null;
    documentClass?: DocumentClass | null;
    parsedValues?: Prisma.InputJsonValue | null;
  },
): Promise<HealthRecord> {
  if (input.status) healthRecordStatusSchema.parse(input.status);
  if (input.confidence) extractionConfidenceSchema.parse(input.confidence);
  if (input.documentClass) documentClassSchema.parse(input.documentClass);
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: {
      status: input.status,
      confidence: input.confidence ?? undefined,
      documentClass: input.documentClass ?? undefined,
      parsedValues: (input.parsedValues ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  });
}
