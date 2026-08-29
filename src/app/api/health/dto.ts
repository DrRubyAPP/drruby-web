import { z } from "zod";
import {
  documentClassSchema,
  extractionConfidenceSchema,
  healthRecordKindSchema,
  healthRecordStatusSchema,
} from "@/lib/db/enums";
import type {
  DecisionHealthRecord,
  HealthRecord,
  HealthSource,
} from "~prisma/client";

// =============================================================================
// DTOs
// =============================================================================

/** HealthSource 原件 DTO */
export const HealthSourceDTO = z.object({
  id: z.string(),
  fileName: z.string(),
  mime: z.string().nullable().optional(),
  objectKey: z.string().nullable().optional(),
  uploadedAt: z.string(),
});
export const HealthSourceListResponse = z.array(HealthSourceDTO);

/** HealthRecord DTO（含状态机字段 + provenance） */
export const HealthRecordDTO = z.object({
  id: z.string(),
  sourceId: z.string(),
  kind: healthRecordKindSchema,
  documentClass: documentClassSchema.nullable().optional(),
  title: z.string(),
  status: healthRecordStatusSchema,
  confidence: extractionConfidenceSchema.nullable().optional(),
  parsedValues: z.unknown().nullable().optional(),
  /** Contract §13：Please confirm 标记（抽取时由 Extractor 写入） */
  pleaseConfirm: z.array(z.string()).optional(),
  recordedAt: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  /** 原件信息（含 1:1 source） */
  source: HealthSourceDTO.optional(),
  /** 修正历史（provenance，详情时返回） */
  revisions: z
    .array(
      z.object({
        id: z.string(),
        diffSummary: z.string().nullable().optional(),
        correctedBy: z.string(),
        correctedAt: z.string(),
        reason: z.string().nullable().optional(),
      }),
    )
    .optional(),
});
export const HealthRecordListResponse = z.array(HealthRecordDTO);

/** Decision ⇄ HealthRecord 关联 DTO（含 healthRecord 详情） */
export const DecisionHealthRecordDTO = z.object({
  id: z.string(),
  decisionId: z.string(),
  healthRecordId: z.string(),
  connectedBy: z.string(),
  connectedAt: z.string(),
  /** removedAt 仅在历史查询时返回；active 列表恒为 null */
  removedAt: z.string().nullable().optional(),
  healthRecord: HealthRecordDTO,
});
export const DecisionHealthRecordListResponse = z.array(
  DecisionHealthRecordDTO,
);

// =============================================================================
// Body schemas
// =============================================================================

/** 上传原件 body（V1 占位存储：objectKey 为本地路径/字符串） */
export const UploadSourceBody = z.object({
  fileName: z.string().min(1),
  mime: z.string().optional(),
  objectKey: z.string().optional(),
  kind: healthRecordKindSchema,
  recordedAt: z.string(),
});

/** 手动录入 body（直接 CONFIRMED，不走 Extractor） */
export const ManualLogBody = z.object({
  kind: healthRecordKindSchema,
  title: z.string().min(1),
  parsedValues: z.unknown().optional(),
  recordedAt: z.string(),
});

/** 状态机推进 body（PATCH /api/health/records/[id] action=advance） */
export const AdvanceStatusBody = z.object({
  action: z.literal("advance"),
  status: healthRecordStatusSchema,
});

/** 纠错 body（PATCH /api/health/records/[id] action=correct，走 HealthRecordRevision append-only） */
export const CorrectRecordBody = z.object({
  action: z.literal("correct"),
  parsedValues: z.unknown(),
  diffSummary: z.string().optional(),
  reason: z.string().optional(),
});

/** Connect body（POST /api/decisions/[id]/health-records） */
export const ConnectRecordBody = z.object({
  healthRecordId: z.string().min(1),
});

// =============================================================================
// Mappers
// =============================================================================

export function toSourceDTO(
  row: HealthSource,
): z.infer<typeof HealthSourceDTO> {
  return {
    id: row.id,
    fileName: row.fileName,
    mime: row.mime,
    objectKey: row.objectKey,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

export function toRecordDTO(
  row: HealthRecord & {
    healthSource?: HealthSource | null;
    revisions?: Array<{
      id: string;
      diffSummary: string | null;
      correctedBy: string;
      correctedAt: Date;
      reason: string | null;
    }>;
  },
): z.infer<typeof HealthRecordDTO> {
  return {
    id: row.id,
    sourceId: row.sourceId,
    kind: healthRecordKindSchema.parse(row.kind),
    documentClass: row.documentClass
      ? documentClassSchema.parse(row.documentClass)
      : null,
    title: row.title,
    status: healthRecordStatusSchema.parse(row.status),
    confidence: row.confidence
      ? extractionConfidenceSchema.parse(row.confidence)
      : null,
    parsedValues: row.parsedValues,
    recordedAt: row.recordedAt.toISOString(),
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
    source: row.healthSource ? toSourceDTO(row.healthSource) : undefined,
    revisions: row.revisions?.map((r) => ({
      id: r.id,
      diffSummary: r.diffSummary,
      correctedBy: r.correctedBy,
      correctedAt: r.correctedAt.toISOString(),
      reason: r.reason,
    })),
  };
}

export function toDecisionHealthRecordDTO(
  row: DecisionHealthRecord & {
    healthRecord: HealthRecord & { healthSource?: HealthSource | null };
  },
): z.infer<typeof DecisionHealthRecordDTO> {
  return {
    id: row.id,
    decisionId: row.decisionId,
    healthRecordId: row.healthRecordId,
    connectedBy: row.connectedBy,
    connectedAt: row.connectedAt.toISOString(),
    removedAt: row.removedAt?.toISOString() ?? null,
    healthRecord: toRecordDTO(row.healthRecord),
  };
}
