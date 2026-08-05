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
