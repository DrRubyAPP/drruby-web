/**
 * 镜像 GET /api/admin/users 的 DTO（见 src/app/api/admin/users/route.ts）。
 * 独立声明 interface，避免拉入服务端 zod schema / prisma。
 */

export type AdminUserRole = "user" | "clinic" | "collaborator" | "admin";
export type AdminUserStatus = "active" | "suspended" | "deleted";

export interface AdminUserDTO {
  id: string;
  email: string;
  name: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  authProvider: string;
  emailVerified: boolean;
  subscriptionTier: string;
  timezone: string;
  lastLoginAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface AdminUserListResponse {
  data: AdminUserDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/** i18n key 后缀：role → `admin.users.role.<r>`（配合 useTranslations("admin")）。 */
export function roleLabelKey(role: AdminUserRole): string {
  return `users.role.${role}`;
}

/** i18n key 后缀：status → `admin.users.status.<s>`。deleted 不在 UI 暴露选项。 */
export function statusLabelKey(status: "active" | "suspended"): string {
  return `users.status.${status}`;
}
