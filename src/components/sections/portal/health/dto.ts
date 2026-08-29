import type {
  DocumentClass,
  ExtractionConfidence,
  HealthRecordKind,
  HealthRecordStatus,
} from "@/lib/db/enums";

/** 三端点响应形状（镜像 route.ts 的 DTO；仅前端消费用）。 */
export interface SignalDto {
  id: string;
  label: string;
  value: string;
  unit?: string;
  source: string;
  confidence: string;
  trend?: string;
}

export interface HormoneDto {
  id: string;
  marker: string;
  value: string;
  phase: string;
  note: string;
}

export interface SkinZoneDto {
  name: string;
  status: string;
}

export interface SkinScanDto {
  date: string;
  headline: string;
  zones: SkinZoneDto[];
}

// =============================================================================
// task-42 T6: My Health 摄入域客户端 DTO（镜像 server src/app/api/health/dto.ts）
// =============================================================================

/** Contract §12 抽取结果中的单条结构化项（V1 占位 schema）。 */
export interface ParsedValueItem {
  name: string;
  value?: string | number | null;
  unit?: string;
  flag?: string;
  /** 单项置信（V1 可选，未填则回退到 Record.confidence） */
  confidence?: ExtractionConfidence;
}

/** §12 HealthSource 原件 DTO（与 server HealthSourceDTO 对齐）。 */
export interface HealthSourceDto {
  id: string;
  fileName: string;
  mime?: string | null;
  objectKey?: string | null;
  uploadedAt: string;
}

/** §12 HealthRecordRevision append-only 修正历史 DTO。 */
export interface RecordRevisionDto {
  id: string;
  diffSummary?: string | null;
  correctedBy: string;
  correctedAt: string;
  reason?: string | null;
}

/**
 * §12 HealthRecord DTO（Record 层）。
 * parsedValues 在 server 端是 unknown（V1 schema 自由形态），
 * 客户端通过 mapParsedValues 收敛到 ParsedValueItem[]。
 */
export interface HealthRecordDto {
  id: string;
  sourceId: string;
  kind: HealthRecordKind;
  documentClass?: DocumentClass | null;
  title: string;
  status: HealthRecordStatus;
  confidence?: ExtractionConfidence | null;
  parsedValues?: unknown;
  /** §13 Please confirm 标记（抽取时由 Extractor 写入） */
  pleaseConfirm?: string[];
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
  /** 原件信息（含 1:1 source） */
  source?: HealthSourceDto;
  /** 修正历史（provenance，详情时返回） */
  revisions?: RecordRevisionDto[];
}

/** §2 显式 Connect 关联 DTO（含 healthRecord 详情）。 */
export interface DecisionHealthRecordDto {
  id: string;
  decisionId: string;
  healthRecordId: string;
  connectedBy: string;
  connectedAt: string;
  /** removedAt 仅在历史查询时返回；active 列表恒为 null */
  removedAt?: string | null;
  healthRecord: HealthRecordDto;
}
