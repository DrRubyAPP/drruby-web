import type { TimelineEventDto, TimelineKind } from "./dto";

/** kind → 显示标签（mapper 维护，UI 透传渲染）。 */
export const KIND_LABEL: Record<TimelineKind, string> = {
  note: "Reflection",
  treatment: "Treatment",
  photo: "Photo",
  lab: "Lab",
  decision: "Decision",
  outcome: "Outcome",
};

export interface TimelineItem {
  id: string;
  /** mapper 输出 Date 对象（绝对时间），UI 用 Intl 格式化。 */
  date: Date;
  /** kind 经 KIND_LABEL 映射后的显示标签。 */
  label: string;
  title: string;
  detail: string;
  source: string;
  hasDetail: boolean;
  hasSource: boolean;
}

export interface TimelinePage {
  items: TimelineItem[];
  hasMore: boolean;
}

/** DTO[] + visibleCount → 当前页切片 + 是否还有更多。 */
export function mapTimeline(
  dtos: TimelineEventDto[],
  visibleCount: number,
): TimelinePage {
  const slice = dtos.slice(0, Math.max(0, visibleCount));
  return {
    items: slice.map(toItem),
    hasMore: dtos.length > visibleCount,
  };
}

function toItem(dto: TimelineEventDto): TimelineItem {
  const detail = dto.detail ?? "";
  const source = dto.source ?? "";
  const label = KIND_LABEL[dto.kind] ?? capitalize(dto.kind);
  return {
    id: dto.id,
    date: new Date(dto.date),
    label,
    title: dto.title,
    detail,
    source,
    hasDetail: detail.trim().length > 0,
    hasSource: source.trim().length > 0,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
