import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 配置（CLI 不再自动读取 .env，需手动 dotenv 加载）。
 * 数据库 URL 从 datasource 块迁移至此，migrate / generate 均读取这里。
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"), // migrate dev 需要影子库时启用
  },
  migrations: {
    path: path.join("prisma", "migrations"),
  },
});
