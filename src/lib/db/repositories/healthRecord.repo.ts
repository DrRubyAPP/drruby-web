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
import { AppError } from "@/lib/errors";
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

/**
 * 按 recordedAt 倒序列出某用户的健康记录（含 healthSource）。
 * task-49 F3：默认过滤软删（deletedAt: null）。
 * task-49 D-1：带活跃连接计数（removedAt: null），驱动列表「待连接」徽标。
 */
export async function listByUser(userId: string) {
  return prisma.healthRecord.findMany({
    where: { userId, deletedAt: null },
    orderBy: { recordedAt: "desc" },
    include: {
      healthSource: true,
      _count: { select: { decisions: { where: { removedAt: null } } } },
    },
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
 * 合法状态转移表（Contract §12；task-48 F5 补 FAILED）：
 * - SOURCE_UPLOADED → PROCESSING（触发抽取）
 * - PROCESSING → EXTRACTED_DRAFT | FAILED（抽取终态）
 * - EXTRACTED_DRAFT → USER_REVIEW | CONFIRMED（可直接 confirm）
 * - USER_REVIEW → CONFIRMED
 * - FAILED → PROCESSING（Retry，§13 失败恢复）
 * - CONFIRMED 为终态；手动录入 create 时直落 CONFIRMED，不经本表
 */
const LEGAL_TRANSITIONS: Record<HealthRecordStatus, HealthRecordStatus[]> = {
  SOURCE_UPLOADED: ["PROCESSING"],
  PROCESSING: ["EXTRACTED_DRAFT", "FAILED"],
  EXTRACTED_DRAFT: ["USER_REVIEW", "CONFIRMED"],
  USER_REVIEW: ["CONFIRMED"],
  FAILED: ["PROCESSING"],
  CONFIRMED: [],
};

/**
 * 推进状态机（Contract §12）—— 带转移合法性校验（task-48 F5）。
 * 非法转移抛 `ILLEGAL_STATUS_TRANSITION`(409)；记录不存在抛 `NOT_FOUND`(404)。
 */
export async function advanceStatus(
  recordId: string,
  next: HealthRecordStatus,
): Promise<HealthRecord> {
  healthRecordStatusSchema.parse(next);
  const cur = await prisma.healthRecord.findUnique({
    where: { id: recordId },
    select: { status: true },
  });
  if (!cur) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  const from = healthRecordStatusSchema.parse(cur.status);
  if (!LEGAL_TRANSITIONS[from].includes(next)) {
    throw new AppError(
      "ILLEGAL_STATUS_TRANSITION",
      `非法状态转移：${from} → ${next}`,
      409,
    );
  }
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: { status: next },
  });
}

/**
 * F6 同 hash 结果缓存（task-48）：查同用户、同 hash、已有成功抽取结果
 * （EXTRACTED_DRAFT/CONFIRMED）的其他 Record —— 命中则复用其抽取结果，
 * 不再打模型（省成本、去重复）。走 HealthRecord join healthSource.hash，
 * 不新增表、不产生迁移（C-3）。
 */
export async function findDoneExtractionByHash(
  userId: string,
  hash: string,
  excludeRecordId: string,
): Promise<HealthRecord | null> {
  return prisma.healthRecord.findFirst({
    where: {
      userId,
      id: { not: excludeRecordId },
      status: { in: ["EXTRACTED_DRAFT", "CONFIRMED"] },
      healthSource: { hash },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * 更新抽取结果（Extractor 返回后写入；Contract §13）
 * 不走 append-only（append-only 仅用于用户纠错 → HealthRecordRevision）；
 * Extractor 输出是机器初值，可被下一次抽取覆盖。
 * task-48：pleaseConfirm（§13 需核实字段）+ error（失败原因，传 null 显式清空）。
 */
export async function updateExtraction(
  recordId: string,
  input: {
    status?: HealthRecordStatus;
    confidence?: ExtractionConfidence | null;
    documentClass?: DocumentClass | null;
    parsedValues?: Prisma.InputJsonValue | null;
    /** §13 需核实字段标记（低置信/冲突项），成功抽取时写入 */
    pleaseConfirm?: string[];
    /** 失败原因（用户安全文案）；传 null 清空（Retry 成功后），undefined 不动 */
    error?: string | null;
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
      pleaseConfirm: input.pleaseConfirm,
      extractionError: input.error === undefined ? undefined : input.error,
    },
  });
}

/**
 * task-49 F3：软删除留痕（不物理删除；列表过滤、详情按 404 处理）。
 * 记录不存在抛 NOT_FOUND(404)；重复软删幂等（仅再次置时间戳）。
 */
export async function softDelete(recordId: string): Promise<HealthRecord> {
  const cur = await prisma.healthRecord.findUnique({
    where: { id: recordId },
    select: { id: true },
  });
  if (!cur) {
    throw new AppError("NOT_FOUND", "记录不存在", 404);
  }
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
  });
}

/**
 * task-49 D-1：「暂不处理」落库——用户明确知道但不接。
 * 幂等：重复提交仅刷新时间戳。Cancel 不走这里（Cancel 无状态）。
 */
export async function dismissConnect(recordId: string): Promise<HealthRecord> {
  return prisma.healthRecord.update({
    where: { id: recordId },
    data: { connectDismissedAt: new Date() },
  });
}
