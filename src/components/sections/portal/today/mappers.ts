import type { AgingMetricDto, AttentionDto } from "./dto";

export interface AttentionCard {
  id: string;
  tag: string;
  title: string;
  body: string;
  accent: AttentionDto["accent"];
  /** body 是否为空（缺润色降级时服务端可能回 ""）— UI 据此条件渲染 <p>。 */
  hasBody: boolean;
}

export interface AgingRow {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: AgingMetricDto["tone"];
  hasCaption: boolean;
}

/** attention DTO[] → 卡片视图行。透传字段；空 body 标记 hasBody=false。 */
export function mapAttention(dtos: AttentionDto[]): AttentionCard[] {
  return dtos.map((d) => ({
    id: d.id,
    tag: d.tag,
    title: d.title,
    body: d.body,
    accent: d.accent,
    hasBody: d.body.trim().length > 0,
  }));
}

/** aging DTO[] → 指标行。透传字段；空 caption 标记 hasCaption=false。 */
export function mapAging(dtos: AgingMetricDto[]): AgingRow[] {
  return dtos.map((d) => ({
    id: d.id,
    label: d.label,
    value: d.value,
    caption: d.caption,
    tone: d.tone,
    hasCaption: d.caption.trim().length > 0,
  }));
}
