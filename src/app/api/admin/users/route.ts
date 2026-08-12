import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { userAccountRepo } from "@/lib/db";
import { userRoleSchema, userStatusSchema } from "@/lib/db/enums";
import type { AdminUserRow } from "@/lib/db/repositories/userAccount.repo";
import { handle } from "@/lib/errors";

/** Admin 用户 DTO：不含 passwordHash / googleSub / deletedAt（敏感字段不外泄）。 */
export const AdminUserDTO = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: userRoleSchema,
  status: userStatusSchema,
  authProvider: z.string(),
  emailVerified: z.boolean(),
  subscriptionTier: z.string(),
  timezone: z.string(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AdminUserDTO = z.infer<typeof AdminUserDTO>;

/** List 接口响应：分页元数据 + 数据数组。 */
export const AdminUserListResponse = z.object({
  data: z.array(AdminUserDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>;

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().optional(),
});

const PAGE_SIZE = 20;

/** 把 repo 行（Date 字段）转为 DTO（ISO 字符串）。 */
export function toAdminUserDTO(row: AdminUserRow): AdminUserDTO {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: userRoleSchema.parse(row.role),
    status: userStatusSchema.parse(row.status),
    authProvider: row.authProvider,
    emailVerified: row.emailVerified,
    subscriptionTier: row.subscriptionTier,
    timezone: row.timezone,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * List users (admin)
 * @description 管理后台用户列表（分页 + email/name 搜索）。仅 admin 角色可访问。
 * @query page integer 默认 1
 * @query search string 按 email 或 name 部分匹配（case-insensitive）
 * @response AdminUserListResponse
 * @auth bearer admin
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  await requireRole("admin");
  const url = new URL(req.url);
  const { page, search } = ListQuery.parse({
    page: url.searchParams.get("page") ?? 1,
    search: url.searchParams.get("search") ?? undefined,
  });
  const { data, total } = await userAccountRepo.list({
    page,
    pageSize: PAGE_SIZE,
    search,
  });
  return NextResponse.json({
    data: data.map(toAdminUserDTO),
    total,
    page,
    pageSize: PAGE_SIZE,
  } satisfies AdminUserListResponse);
});
