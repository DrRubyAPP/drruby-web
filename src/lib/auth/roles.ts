/**
 * 角色相关的纯函数（无服务端依赖，可在 Client Component 中安全导入）。
 */

/**
 * 会话角色对应的「用户首页」入口：
 * clinic → /clinic，collaborator → /collaborate/workspace，其余（含 user、admin）→ /portal。
 *
 * admin 也是一般用户，可进入消费者门户；其「管理后台」入口由 UserMenu 单独条件渲染。
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
 *
 * admin 返回 "portal"：admin 同时具备消费者门户入口；
 * admin 的「管理后台」入口在 UserMenu 中由 `role === "admin"` 单独条件渲染。
 */
export function homeNavKeyForRole(
  role?: string | null,
): "portal" | "clinic" | "collaborate" {
  if (role === "clinic") return "clinic";
  if (role === "collaborator") return "collaborate";
  return "portal";
}
