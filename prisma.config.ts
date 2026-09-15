import { config } from "dotenv";

// dotenv 默认只读 .env，这里对齐 Next.js 的优先级：.env.local > .env
config({ path: ".env.local" });
config({ path: ".env" });
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const useTestingDatabase = process.env.USE_TESTING_DATABASE === "true";
const databaseUrl = useTestingDatabase
  ? env("TESTING_DATABASE_URL")
  : env("DATABASE_URL");

/**
 * Prisma 7 配置（CLI 不再自动读取 .env，需手动 dotenv 加载）。
 * 数据库 URL 从 datasource 块迁移至此，migrate / generate 均读取这里。
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
    // `migrate deploy` for the test DB only applies checked-in migrations;
    // it does not need, or share, the development migration shadow database.
    ...(useTestingDatabase
      ? {}
      : { shadowDatabaseUrl: env("SHADOW_DATABASE_URL") }),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
  },
});
