/**
 * 镜像 GET/POST /api/health/reports 的 HealthRecordDTO
 * （见 src/app/api/health/reports/route.ts）。独立声明，避免拉入 server/prisma/zod。
 */
export interface HealthRecordDto {
  id: string;
  kind: HealthRecordKind;
  title: string;
  source?: string;
  objectKey?: string;
  ocrStatus: OcrStatus;
  recordedAt: string; // ISO
}

export type HealthRecordKind = "lab" | "imaging" | "checkup" | "vitals";
export type OcrStatus = "pending" | "processing" | "done" | "manual";

export const KIND_VALUES: HealthRecordKind[] = [
  "lab",
  "imaging",
  "checkup",
  "vitals",
];

/** POST 入参（本轮人工录入；objectKey 不在表单，交由后端置默认/留空） */
export interface CreateHealthRecordInput {
  kind: HealthRecordKind;
  title: string;
  source?: string;
  recordedAt: string; // ISO
}

/** i18n key 后缀：kind → `kind.<k>`，ocrStatus → `status.<s>`（配合 useTranslations("portal.reports")） */
export function kindLabelKey(kind: HealthRecordKind): string {
  return `kind.${kind}`;
}
export function statusLabelKey(status: OcrStatus): string {
  return `status.${status}`;
}

/** <input type="date"> 的 "YYYY-MM-DD" → ISO；已是 ISO 则归一。空/非法返回 null。 */
export function toIsoDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO → 展示日期（en-US，容忍时区）。非法回退原串。 */
export function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
