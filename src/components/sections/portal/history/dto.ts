/** 镜像 /api/timeline 的 TimelineEventDTO（见 src/app/api/timeline/route.ts）。 */
export type TimelineKind =
  | "note"
  | "treatment"
  | "photo"
  | "lab"
  | "decision"
  | "outcome";

export interface TimelineEventDto {
  id: string;
  /** ISO 字符串，来自服务端 row.occurredAt.toISOString() */
  date: string;
  kind: TimelineKind;
  title: string;
  detail?: string;
  source?: string;
}
