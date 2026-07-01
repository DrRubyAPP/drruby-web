import "server-only";
import pino from "pino";

/**
 * 项目统一的服务端结构化日志。
 *
 * - dev：经 `pino-pretty` 输出彩色可读日志；
 * - test / prod：输出结构化 JSON（不加载 pino-pretty worker）。
 *
 * **约束**：仅在 Node 服务端（RSC / route handler / server action）引入，
 * **禁止**在 `src/proxy.ts`（Edge 运行时）与任何 client 组件中 import。
 */
const isPretty = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isPretty
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});
