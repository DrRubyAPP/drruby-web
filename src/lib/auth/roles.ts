/**
 * 角色相关的纯函数（无服务端依赖，可在 Client Component 中安全导入）。
 */

/**
 * 会话中的角色对应的首页入口：
 * clinic → /clinic，collaborator → /collaborate/workspace，admin → /（admin 无消费者门户，回首页避免 portal 守卫死循环），其余 → /portal。
 */
export function homeHrefForRole(
  role?: string | null,
): "/portal" | "/clinic" | "/collaborate/workspace" | "/" {
  if (role === "clinic") return "/clinic";
  if (role === "collaborator") return "/collaborate/workspace";
  if (role === "admin") return "/";
  return "/portal";
}

/**
 * 角色首页入口对应的 `nav.<key>` i18n key，用于导航标签统一取值，
 * 避免各 nav 组件散落 `role === "clinic"` 分支导致落点/文案不一致。
 *
 * admin 返回 null：admin 用户无消费者门户首页入口，UserMenu 不应渲染「用户首页」项；
 * admin 的「管理后台」入口在 sub-plan-2 任务 9 由 UserMenu 单独条件渲染。
 */
export function homeNavKeyForRole(
  role?: string | null,
): "portal" | "clinic" | "collaborate" | null {
  if (role === "clinic") return "clinic";
  if (role === "collaborator") return "collaborate";
  if (role === "admin") return null;
  return "portal";
}
