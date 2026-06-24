import type { UserAccount } from "@prisma/client";
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
 * 软删除：置 status=deleted + deletedAt
 * 红线 §0.3.7：删号时脱敏保留研究数据而非物理删除
 */
export async function softDelete(id: string): Promise<UserAccount> {
  return prisma.userAccount.update({
    where: { id },
    data: { status: "deleted", deletedAt: new Date() },
  });
}
