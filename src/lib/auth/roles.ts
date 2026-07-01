/**
 * 角色相关的纯函数（无服务端依赖，可在 Client Component 中安全导入）。
 */

/** 会话中的角色对应的首页入口：clinic → /clinic，其余 → /portal。 */
export function homeHrefForRole(role?: string | null): "/portal" | "/clinic" {
  return role === "clinic" ? "/clinic" : "/portal";
}
