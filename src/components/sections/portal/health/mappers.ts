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

export type HealthRecordHighlight =
  | { type: "vitals" | "lab" | "medication" | "treatment"; value: string }
  | { type: "symptom"; value: string; level: number };

export type HealthRecordExitStatus = "stopped" | "resolved";

type ParsedRecord = {
  items?: unknown;
  value?: unknown;
  unit?: unknown;
  dosage?: unknown;
  dose?: unknown;
  frequency?: unknown;
  cadence?: unknown;
  severity?: unknown;
  status?: unknown;
};

function asRecord(value: unknown): ParsedRecord | null {
  return value && typeof value === "object" ? (value as ParsedRecord) : null;
}

/** Returns a terminal state only for the kinds that support one. */
export function healthRecordExitStatus(
  dto: HealthRecordDto,
): HealthRecordExitStatus | null {
  if (
    dto.kind !== "medication" &&
    dto.kind !== "treatment" &&
    dto.kind !== "symptom"
  ) return null;
  const parsed = asRecord(dto.parsedValues);
  const status = parsed?.status;
  if (typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase();
  if (
    (dto.kind === "medication" || dto.kind === "treatment") &&
    normalized === "stopped"
  ) return "stopped";
  if (dto.kind === "symptom" && normalized === "resolved") return "resolved";
  return null;
}

function asDisplayValue(value: unknown, unit?: unknown): string | null {
  if (value && typeof value === "object") {
    const nested = value as { value?: unknown; unit?: unknown };
    return asDisplayValue(nested.value, nested.unit);
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const suffix = typeof unit === "string" && unit.trim() ? ` ${unit}` : "";
  return `${value}${suffix}`;
}

function namedItemValue(parsed: ParsedRecord, names: string[]): string | null {
  if (!Array.isArray(parsed.items)) return null;
  for (const item of parsed.items) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as {
      name?: unknown;
      value?: unknown;
      unit?: unknown;
    };
    if (
      typeof candidate.name === "string" &&
      names.includes(candidate.name.trim().toLowerCase())
    ) {
      return asDisplayValue(candidate.value, candidate.unit);
    }
  }
  return null;
}

function firstItemValue(parsed: ParsedRecord): string | null {
  if (!Array.isArray(parsed.items)) return null;
  for (const item of parsed.items) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as { value?: unknown; unit?: unknown };
    const value = asDisplayValue(candidate.value, candidate.unit);
    if (value) return value;
  }
  return null;
}

function bloodPressureValue(parsed: ParsedRecord): string | null {
  const directSystolic = asDisplayValue(
    (parsed as { systolic?: unknown }).systolic,
  );
  const directDiastolic = asDisplayValue(
    (parsed as { diastolic?: unknown }).diastolic,
  );
  if (directSystolic && directDiastolic) {
    return `${directSystolic} / ${directDiastolic}${
      typeof parsed.unit === "string" && parsed.unit.trim()
        ? ` ${parsed.unit}`
        : ""
    }`;
  }

  if (!Array.isArray(parsed.items)) return null;
  const values = parsed.items.reduce<{
    systolic?: string;
    diastolic?: string;
    unit?: string;
  }>((result, item) => {
    if (!item || typeof item !== "object") return result;
    const candidate = item as {
      name?: unknown;
      value?: unknown;
      unit?: unknown;
    };
    if (typeof candidate.name !== "string") return result;
    const value = asDisplayValue(candidate.value);
    if (!value) return result;
    const unit = typeof candidate.unit === "string" ? candidate.unit : undefined;
    if (candidate.name.toLowerCase().includes("systolic")) {
      return { ...result, systolic: value, unit };
    }
    if (candidate.name.toLowerCase().includes("diastolic")) {
      return { ...result, diastolic: value, unit: result.unit ?? unit };
    }
    return result;
  }, {});
  return values.systolic && values.diastolic
    ? `${values.systolic} / ${values.diastolic}${values.unit ? ` ${values.unit}` : ""}`
    : null;
}

function severityLevel(value: string): number {
  const normalized = value.trim().toLowerCase();
  const numeric = Number(normalized);
  if (Number.isFinite(numeric))
    return Math.max(1, Math.min(5, Math.round(numeric)));
  if (/none|clear|absent/.test(normalized)) return 1;
  if (/mild|low|slight/.test(normalized)) return 2;
  if (/moderate|medium/.test(normalized)) return 3;
  if (/very severe|extreme/.test(normalized)) return 5;
  if (/severe|high|marked/.test(normalized)) return 4;
  return 0;
}

/** Extract the current dashboard value from direct fields or V1 item values. */
export function healthRecordHighlight(
  dto: HealthRecordDto,
): HealthRecordHighlight | null {
  const parsed = asRecord(dto.parsedValues);
  if (!parsed) return null;

  if (dto.kind === "vitals") {
    const value =
      (dto.metricCode === "blood_pressure"
        ? bloodPressureValue(parsed)
        : null) ??
      asDisplayValue(parsed.value, parsed.unit) ??
      firstItemValue(parsed);
    return value ? { type: "vitals", value } : null;
  }
  if (dto.kind === "lab") {
    const value =
      asDisplayValue(parsed.value, parsed.unit) ?? firstItemValue(parsed);
    return value ? { type: "lab", value } : null;
  }
  if (dto.kind === "medication") {
    const value =
      asDisplayValue(parsed.dosage) ??
      asDisplayValue(parsed.dose) ??
      namedItemValue(parsed, ["dosage", "dose"]);
    return value ? { type: "medication", value } : null;
  }
  if (dto.kind === "treatment") {
    const value =
      asDisplayValue(parsed.frequency) ??
      asDisplayValue(parsed.cadence) ??
      namedItemValue(parsed, ["frequency", "cadence"]);
    return value ? { type: "treatment", value } : null;
  }
  if (dto.kind === "symptom") {
    const value =
      asDisplayValue(parsed.severity) ?? namedItemValue(parsed, ["severity"]);
    return value
      ? { type: "symptom", value, level: severityLevel(value) }
      : null;
  }
  return null;
}

/** Stable identity used to group a metric's current value and history. */
export function healthRecordMetricKey(dto: HealthRecordDto): string {
  return dto.metricCode && dto.metricCode !== "other"
    ? `metric:${dto.kind}:${dto.metricCode}`
    : `other:${dto.kind}:${dto.title.trim().toLocaleLowerCase()}`;
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    return numericValue((value as { value?: unknown }).value);
  }
  return null;
}

/**
 * Returns a chartable value when a record includes one. Blood pressure uses
 * systolic pressure as the plotted series; the dashboard still displays both
 * systolic and diastolic values together.
 */
export function numericHealthRecordValue(
  dto: HealthRecordDto,
): { value: number; unit?: string } | null {
  const parsed = asRecord(dto.parsedValues);
  if (!parsed) return null;
  if (dto.kind === "symptom") {
    const severity = asDisplayValue(parsed.severity) ??
      namedItemValue(parsed, ["severity"]);
    const value = severity ? severityLevel(severity) : 0;
    return value ? { value, unit: "severity" } : null;
  }

  if (Array.isArray(parsed.items)) {
    const preferred = dto.metricCode === "blood_pressure"
      ? parsed.items.find(
          (item) =>
            !!item &&
            typeof item === "object" &&
            typeof (item as { name?: unknown }).name === "string" &&
            (item as { name: string }).name.toLowerCase().includes("systolic"),
        )
      : parsed.items[0];
    if (preferred && typeof preferred === "object") {
      const item = preferred as { value?: unknown; unit?: unknown };
      const value = numericValue(item.value);
      if (value !== null) {
        return { value, unit: typeof item.unit === "string" ? item.unit : undefined };
      }
    }
  }

  const candidates = [parsed.value, parsed.dosage, parsed.dose, parsed.frequency];
  for (const candidate of candidates) {
    const value = numericValue(candidate);
    if (value !== null) return { value, unit: typeof parsed.unit === "string" ? parsed.unit : undefined };
  }
  return null;
}

/** The two independently chartable series that make up a blood-pressure reading. */
export function bloodPressureRecordValues(
  dto: HealthRecordDto,
): { systolic: number | null; diastolic: number | null; unit?: string } | null {
  if (dto.kind !== "vitals" || dto.metricCode !== "blood_pressure") return null;
  const parsed = asRecord(dto.parsedValues);
  if (!parsed) return { systolic: null, diastolic: null };
  if (Array.isArray(parsed.items)) {
    const values = parsed.items.reduce<{
      systolic: number | null;
      diastolic: number | null;
      unit?: string;
    }>(
      (result, item) => {
        if (!item || typeof item !== "object") return result;
        const candidate = item as {
          name?: unknown;
          value?: unknown;
          unit?: unknown;
        };
        if (typeof candidate.name !== "string") return result;
        const name = candidate.name.toLowerCase();
        const unit = typeof candidate.unit === "string" ? candidate.unit : result.unit;
        if (name.includes("systolic")) {
          return { ...result, systolic: numericValue(candidate.value), unit };
        }
        if (name.includes("diastolic")) {
          return { ...result, diastolic: numericValue(candidate.value), unit };
        }
        return result;
      },
      { systolic: null, diastolic: null },
    );
    return values;
  }
  return {
    systolic: numericValue((parsed as { systolic?: unknown }).systolic),
    diastolic: numericValue((parsed as { diastolic?: unknown }).diastolic),
    unit: typeof parsed.unit === "string" ? parsed.unit : undefined,
  };
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
