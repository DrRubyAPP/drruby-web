import {
  type AuthProvider,
  authProviderSchema,
  type SubscriptionTier,
  subscriptionTierSchema,
  type UserRole,
  type UserStatus,
  userRoleSchema,
  userStatusSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Prisma, UserAccount } from "~prisma/client";

export interface CreateUserAccountInput {
  email: string;
  authProvider: AuthProvider;
  role: UserRole;
  subscriptionTier?: SubscriptionTier;
  timezone?: string;
  googleSub?: string;
  passwordHash?: string | null;
  emailVerified?: boolean;
}

export interface UpdateUserAccountInput {
  email?: string;
  authProvider?: AuthProvider;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  timezone?: string;
  googleSub?: string | null;
  passwordHash?: string | null;
  emailVerified?: boolean;
  status?: UserStatus;
  lastLoginAt?: Date;
}

function validateCreateInput(input: CreateUserAccountInput): void {
  authProviderSchema.parse(input.authProvider);
  userRoleSchema.parse(input.role);
  if (input.subscriptionTier !== undefined) {
    subscriptionTierSchema.parse(input.subscriptionTier);
  }
}

function validateUpdateInput(input: UpdateUserAccountInput): void {
  if (input.authProvider !== undefined)
    authProviderSchema.parse(input.authProvider);
  if (input.role !== undefined) userRoleSchema.parse(input.role);
  if (input.subscriptionTier !== undefined) {
    subscriptionTierSchema.parse(input.subscriptionTier);
  }
  if (input.status !== undefined) userStatusSchema.parse(input.status);
}

export async function findById(id: string): Promise<UserAccount | null> {
  return prisma.userAccount.findUnique({ where: { id } });
}

/**
 * 大小写不敏感邮箱查找
 * 红线 §0.3.8：A@x.com 与 a@x.com 应为同一账号
 */
export async function findByEmail(email: string): Promise<UserAccount | null> {
  return prisma.userAccount.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

export async function create(
  input: CreateUserAccountInput,
): Promise<UserAccount> {
  validateCreateInput(input);
  return prisma.userAccount.create({ data: input });
}

export async function update(
  id: string,
  data: UpdateUserAccountInput,
): Promise<UserAccount> {
  validateUpdateInput(data);
  return prisma.userAccount.update({ where: { id }, data });
}

/**
 * 更新账号 profile（name/timezone/image）。
 * email 变更须走 better-auth 验证流程，不在此处理。
 */
export async function updateProfile(
  id: string,
  data: { name?: string; timezone?: string; image?: string | null },
): Promise<UserAccount> {
  return prisma.userAccount.update({
    where: { id },
    data: {
      name: data.name,
      timezone: data.timezone,
      image: data.image,
    },
  });
}

/**
 * 软删除：置 status=deleted + deletedAt
 * 红线 §0.3.7：删号时脱敏保留研究数据而非物理删除
 */
export async function softDelete(id: string): Promise<UserAccount> {
  return prisma.userAccount.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date() },
  });
}

/**
 * 软删脱敏（不可逆）：
 * - status='deleted' + deletedAt=now()，行仍在（保留合规最小痕迹，绝不物理删）
 * - 脱敏 email/name（email → `deleted+<id>@deleted.invalid`，name 置空），
 *   使账号无法再定位到自然人，且不与真实邮箱冲突
 * - 失效该用户全部 session（后续 cookie/bearer 均无法再解析出登录态）
 *
 * 红线 §0.3.7 + task-10 SP3：DELETE /me 软删脱敏不可逆。
 */
export async function softDeleteAndAnonymize(id: string): Promise<UserAccount> {
  const anonymizedEmail = `deleted+${id}@deleted.invalid`;
  const [account] = await prisma.$transaction([
    prisma.userAccount.update({
      where: { id },
      data: {
        status: "deleted",
        deletedAt: new Date(),
        email: anonymizedEmail,
        name: null,
        googleSub: null,
        passwordHash: null,
      },
    }),
    // 撤销登录态：删除该用户的所有 session
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  return account;
}

/**
 * Admin 后台用户列表 select：排除 passwordHash / googleSub 等敏感字段。
 * 与 AdminUserDTO 字段对齐（任务 4 路由层）。
 */
export const AdminUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  authProvider: true,
  emailVerified: true,
  subscriptionTier: true,
  timezone: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserAccountSelect;

export type AdminUserRow = Prisma.UserAccountGetPayload<{
  select: typeof AdminUserSelect;
}>;

export interface ListUsersParams {
  page: number;
  pageSize: number;
  search?: string;
}

export interface ListUsersResult {
  data: AdminUserRow[];
  total: number;
}

/**
 * Admin 后台用户列表查询：
 * - 过滤 deletedAt: null（不返回已软删除用户，total 也不含）
 * - search 走 email OR name 部分匹配（case-insensitive）
 * - 按 createdAt 倒序
 * - skip/take 分页（page 从 1 开始）
 *
 * 调用方负责校验 page>=1、pageSize 上限等约束。
 */
export async function list({
  page,
  pageSize,
  search,
}: ListUsersParams): Promise<ListUsersResult> {
  const trimmed = search?.trim();
  const where: Prisma.UserAccountWhereInput = {
    deletedAt: null,
    ...(trimmed
      ? {
          OR: [
            { email: { contains: trimmed, mode: "insensitive" } },
            { name: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.userAccount.findMany({
      where,
      select: AdminUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userAccount.count({ where }),
  ]);
  return { data, total };
}
