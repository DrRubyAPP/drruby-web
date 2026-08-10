/** 镜像 /api/insights/attention 的 AttentionDTO（见 route.ts）。 */
export interface AttentionDto {
  id: string;
  tag: string;
  title: string;
  body: string;
  accent: "red" | "amber" | "purple";
}

/** 镜像 /api/insights/aging-velocity 的 AgingMetricDTO。 */
export interface AgingMetricDto {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: "green" | "amber" | "purple";
}

/** 镜像 /api/insights/refresh 的 RefreshResponse。 */
export interface RefreshResponse {
  attention: number;
  agingVelocity: number;
}
