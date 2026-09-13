import { config } from "dotenv";

/**
 * seed 脚本的环境变量加载（副作用模块）。
 *
 * 必须作为**首个 import** 引入，早于任何会构造 Prisma 客户端的模块
 * （如 `@/lib/db` → prisma.ts 在导入期即读取 `DATABASE_URL`）。
 *
 * dotenv 默认只读 `.env`，而本项目的 `DATABASE_URL` 仅存在于 `.env.local`
 * （`.env` 中该行被注释）。这里对齐 `prisma.config.ts` 的优先级：
 * `.env.local` > `.env`，使 `tsx prisma/*.ts` 与 prisma CLI 行为一致。
 */
config({ path: ".env.local" });
config({ path: ".env" });
