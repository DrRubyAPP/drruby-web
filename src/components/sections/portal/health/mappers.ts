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

/**
 * §12 状态机：status → i18n key（相对 `records` namespace，由调用方 t() 解析）。
 * 例：statusKey("EXTRACTED_DRAFT") → "status.EXTRACTED_DRAFT" → t() → "Draft — review needed"
 */
export function statusKey(s: HealthRecordStatus): string {
  return `status.${s}`;
}

/**
 * §13 抽取置信：confidence → i18n key（相对 `records` namespace）。
 * Low/Conflicting 的文案含 "please confirm"（不确定性不得隐藏，由 i18n value 承载）。
 */
export function confidenceKey(c: ExtractionConfidence): string {
  return `confidence.${c}`;
}

/** documentClass → i18n key（相对 `records` namespace）。 */
export function documentClassKey(d: DocumentClass): string {
  return `documentClass.${d}`;
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

/** HealthRecord DTO → 视图行（带 parsedValues items + source + status i18n key）。 */
export interface HealthRecordRow {
  id: string;
  title: string;
  kind: HealthRecordKind;
  status: HealthRecordStatus;
  /** i18n key（相对 `records` namespace）：t(row.statusKey) → 可读 label。 */
  statusKey: string;
  confidence?: ExtractionConfidence | null;
  /** i18n key（相对 `records` namespace）。 */
  confidenceKey?: string;
  documentClass?: DocumentClass | null;
  /** i18n key（相对 `records` namespace）。 */
  documentClassKey?: string;
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
    statusKey: statusKey(dto.status),
    confidence: dto.confidence ?? null,
    confidenceKey: dto.confidence ? confidenceKey(dto.confidence) : undefined,
    documentClass: dto.documentClass ?? null,
    documentClassKey: dto.documentClass
      ? documentClassKey(dto.documentClass)
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
  healthRecordId: string;
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
    healthRecordId: dto.healthRecordId,
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
