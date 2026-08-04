/**
 * 角色相关的纯函数（无服务端依赖，可在 Client Component 中安全导入）。
 */

/**
 * 会话中的角色对应的首页入口：
 * clinic → /clinic，collaborator → /collaborate/workspace，其余 → /portal。
 */
export function homeHrefForRole(
  role?: string | null,
): "/portal" | "/clinic" | "/collaborate/workspace" {
  if (role === "clinic") return "/clinic";
  if (role === "collaborator") return "/collaborate/workspace";
  return "/portal";
}

/**
 * 角色首页入口对应的 `nav.<key>` i18n key，用于导航标签统一取值，
 * 避免各 nav 组件散落 `role === "clinic"` 分支导致落点/文案不一致。
 */
export function homeNavKeyForRole(
  role?: string | null,
): "portal" | "clinic" | "collaborate" {
  if (role === "clinic") return "clinic";
  if (role === "collaborator") return "collaborate";
  return "portal";
}
