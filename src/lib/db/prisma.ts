import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "~prisma/client";

/**
 * PrismaClient 单例
 *
 * Prisma 7 必须传入 driver adapter（不再内置驱动）；本项目用 @prisma/adapter-pg
 * 直连 PostgreSQL。
 *
 * 开发环境（dev + HMR）下避免每次热更新都新建 PrismaClient 实例，
 * 把单例挂到 globalThis 上复用；生产环境每次模块加载新建一个。
 *
 * 参考：https://www.prisma.io/docs/guides/nextjs#best-practice-for-instantiating-prismaclient-with-nextjs
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
