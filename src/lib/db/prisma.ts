import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient 单例
 *
 * 开发环境（dev + HMR）下避免每次热更新都新建 PrismaClient 实例，
 * 把单例挂到 globalThis 上复用；生产环境每次模块加载新建一个。
 *
 * 参考：https://www.prisma.io/docs/guides/nextjs#best-practice-for-instantiating-prismaclient-with-nextjs
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
