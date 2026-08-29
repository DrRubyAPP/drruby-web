import type {
  DocumentClass,
  ExtractionConfidence,
  HealthRecordKind,
  HealthRecordStatus,
} from "@/lib/db/enums";
import type {
  DecisionHealthRecordDto,
  HealthRecordDto,
  HealthSourceDto,
  HormoneDto,
  ParsedValueItem,
  RecordRevisionDto,
  SignalDto,
  SkinScanDto,
} from "./dto";

export interface SignalRow {
  id: string;
  label: string;
  /** 拼好的展示值：`value + " " + unit`（unit 缺省则仅 value）。 */
  display: string;
  source: string;
  confidence: string;
  /** 归一化趋势：up/down/flat/null（DTO 缺省或未知 → null）。 */
  trend: "up" | "down" | "flat" | null;
}

export interface HormoneRow {
  id: string;
  marker: string;
  value: string;
  phase: string;
  note: string;
}

export interface SkinView {
  /** 展示用日期（YYYY-MM-DD，从 ISO 截取）。 */
  date: string;
  headline: string;
  zones: { name: string; status: string }[];
}

function normalizeTrend(t?: string): SignalRow["trend"] {
  return t === "up" || t === "down" || t === "flat" ? t : null;
}

/** signals DTO[] → 视图行（拼展示值、归一化趋势）。 */
export function mapSignals(dtos: SignalDto[]): SignalRow[] {
  return dtos.map((d) => ({
    id: d.id,
    label: d.label,
    display: d.unit ? `${d.value} ${d.unit}` : d.value,
    source: d.source,
    confidence: d.confidence,
    trend: normalizeTrend(d.trend),
  }));
}

/** hormone DTO[] → 视图行（透传 + 保证字段存在）。 */
export function mapHormones(dtos: HormoneDto[]): HormoneRow[] {
  return dtos.map((d) => ({
    id: d.id,
    marker: d.marker,
    value: d.value,
    phase: d.phase,
    note: d.note ?? "",
  }));
}

/** skin DTO | null → 视图（null 透传给上层走空态；date 截取到日）。 */
export function mapSkin(dto: SkinScanDto | null): SkinView | null {
  if (!dto) return null;
  return {
    date: dto.date.slice(0, 10),
    headline: dto.headline,
    zones: dto.zones.map((z) => ({ name: z.name, status: z.status })),
  };
}

// =============================================================================
// task-42 T6: Source→Record 状态机 + 置信 + Please confirm（Contract §12/§13）
// =============================================================================

const STATUS_LABEL: Record<HealthRecordStatus, string> = {
  SOURCE_UPLOADED: "Uploaded",
  PROCESSING: "Processing…",
  EXTRACTED_DRAFT: "Draft — review needed",
  USER_REVIEW: "In review",
  CONFIRMED: "Confirmed",
};

const CONFIDENCE_LABEL: Record<ExtractionConfidence, string> = {
  High: "High confidence",
  Low: "Low confidence — please confirm",
  Unrecognized: "Unrecognized",
  Conflicting: "Conflicting values — please confirm",
};

const KIND_LABEL: Record<HealthRecordKind, string> = {
  lab: "Lab",
  imaging: "Imaging",
  checkup: "Checkup",
  vitals: "Vitals",
  medication: "Medication",
  symptom: "Symptom",
  treatment: "Treatment",
};

const DOCUMENT_CLASS_LABEL: Record<DocumentClass, string> = {
  Lab: "Lab",
  Imaging: "Imaging",
  Pathology: "Pathology",
  Procedure: "Procedure",
  VisitSummary: "Visit summary",
  Unknown: "Unknown",
};

/** §12 状态机：status → 用户可读 label（如 "Draft — review needed"）。 */
export function statusLabel(s: HealthRecordStatus): string {
  return STATUS_LABEL[s] ?? s;
}

/** §13 抽取置信：confidence → 用户可读 label（Low/Conflicting 含 please confirm）。 */
export function confidenceLabel(c: ExtractionConfidence): string {
  return CONFIDENCE_LABEL[c] ?? c;
}

/** HealthRecord.kind → 用户可读 label。 */
export function kindLabel(k: HealthRecordKind): string {
  return KIND_LABEL[k] ?? k;
}

/** documentClass → 用户可读 label。 */
export function documentClassLabel(d: DocumentClass): string {
  return DOCUMENT_CLASS_LABEL[d] ?? d;
}

/**
 * Contract §13：Please confirm 标记。
 * 抽取时由 Extractor 写入 pleaseConfirm 字段；前端展示需核实标记。
 * 不确定性不得隐藏——有 pleaseConfirm 项就必须显式暴露。
 */
export function needsConfirm(item: { pleaseConfirm?: string[] }): boolean {
  return (item.pleaseConfirm?.length ?? 0) > 0;
}

/** Record 是否处于用户可确认的状态（EXTRACTED_DRAFT/USER_REVIEW 可推进至 CONFIRMED）。 */
export function canConfirm(status: HealthRecordStatus): boolean {
  return status === "EXTRACTED_DRAFT" || status === "USER_REVIEW";
}

/** Record 是否处于失败可重试状态（V1 占位：FAILED 态在 task-42 通过 mock 抽取触发）。 */
export function canRetry(status: HealthRecordStatus): boolean {
  // task-42 落地的状态机不含 FAILED；FAILED 由抽取失败回退到 PROCESSING 重试
  // 此处保留语义钩子，task-43 接入真实状态机后启用
  return status === "SOURCE_UPLOADED" || status === "PROCESSING";
}

/**
 * parsedValues（V1 任意 JSON）→ RecordItem 行视图。
 * V1 schema：`{ items?: ParsedValueItem[] }`；其他形态降级为空数组。
 */
export function mapParsedValues(parsed: unknown): ParsedValueItem[] {
  if (!parsed || typeof parsed !== "object") return [];
  const items = (parsed as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items.filter(
    (it): it is ParsedValueItem =>
      !!it &&
      typeof it === "object" &&
      typeof (it as { name?: unknown }).name === "string",
  );
}

/** HealthRecord DTO → 视图行（带 parsedValues items + source + status label）。 */
export interface HealthRecordRow {
  id: string;
  title: string;
  kind: HealthRecordKind;
  status: HealthRecordStatus;
  statusText: string;
  confidence?: ExtractionConfidence | null;
  confidenceText?: string;
  documentClass?: DocumentClass | null;
  documentClassText?: string;
  items: ParsedValueItem[];
  pleaseConfirm: string[];
  needsConfirm: boolean;
  recordedAt: string;
  source?: HealthSourceDto;
  revisions: RecordRevisionDto[];
}

export function mapHealthRecord(dto: HealthRecordDto): HealthRecordRow {
  const items = mapParsedValues(dto.parsedValues);
  const pleaseConfirm = dto.pleaseConfirm ?? [];
  return {
    id: dto.id,
    title: dto.title,
    kind: dto.kind,
    status: dto.status,
    statusText: statusLabel(dto.status),
    confidence: dto.confidence ?? null,
    confidenceText: dto.confidence
      ? confidenceLabel(dto.confidence)
      : undefined,
    documentClass: dto.documentClass ?? null,
    documentClassText: dto.documentClass
      ? documentClassLabel(dto.documentClass)
      : undefined,
    items,
    pleaseConfirm,
    needsConfirm: pleaseConfirm.length > 0,
    recordedAt: dto.recordedAt,
    source: dto.source,
    revisions: dto.revisions ?? [],
  };
}

export function mapHealthRecords(dtos: HealthRecordDto[]): HealthRecordRow[] {
  return dtos.map(mapHealthRecord);
}

/** Connected Record → 行视图（healthRecord 字段映射 + 连接元数据）。 */
export interface ConnectedRecordRow {
  id: string; // 连接记录 id（decision_health_record.id）
  decisionId: string;
  healthRecord: HealthRecordRow;
  connectedBy: string;
  connectedAt: string;
  removedAt?: string | null;
}

export function mapConnectedRecord(
  dto: DecisionHealthRecordDto,
): ConnectedRecordRow {
  return {
    id: dto.id,
    decisionId: dto.decisionId,
    healthRecord: mapHealthRecord(dto.healthRecord),
    connectedBy: dto.connectedBy,
    connectedAt: dto.connectedAt,
    removedAt: dto.removedAt ?? null,
  };
}

export function mapConnectedRecords(
  dtos: DecisionHealthRecordDto[],
): ConnectedRecordRow[] {
  return dtos.map(mapConnectedRecord);
}

/** HealthSource DTO → 行视图（原件元数据 + 占位 objectKey 链接）。 */
export interface HealthSourceRow {
  id: string;
  fileName: string;
  mime?: string | null;
  objectKey?: string | null;
  uploadedAt: string;
}

export function mapHealthSource(dto: HealthSourceDto): HealthSourceRow {
  return {
    id: dto.id,
    fileName: dto.fileName,
    mime: dto.mime ?? null,
    objectKey: dto.objectKey ?? null,
    uploadedAt: dto.uploadedAt,
  };
}
