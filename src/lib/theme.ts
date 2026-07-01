/**
 * 自研主题工具：两态（light/dark），偏好存 `theme` cookie。
 * 纯函数，服务端（读 cookie 注入 data-theme）与客户端（切换写 cookie）共用。
 */
export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";

/** 归一化 cookie 值：仅 `"dark"` 视为暗色，其余（含缺失/非法）回落默认 `light`。 */
export function normalizeTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : DEFAULT_THEME;
}
