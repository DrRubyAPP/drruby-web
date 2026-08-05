import type { HormoneDto, SignalDto, SkinScanDto } from "./dto";

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
