/**
 * DrRuby DB 层汇总入口
 *
 * 用法：
 *   import { prisma, userAccountRepo, userBaselineRepo } from "@/lib/db";
 *
 * 注意：
 * - prisma 单例只能在 server 端使用（server 组件 / route handler / server actions）
 * - repository 函数均为 async，写入前用 Zod 校验枚举字段
 * - 软删除过滤：Prisma 不自动过滤 deleted_at，调用方需显式 where: { deletedAt: null }
 */

export * from "./enums";
export { prisma } from "./prisma";
export * as userAccountRepo from "./repositories/userAccount.repo";
export * as userBaselineRepo from "./repositories/userBaseline.repo";
