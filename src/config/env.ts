import "server-only";
import { z } from "zod";

/**
 * 服务端环境变量的单一数据源。
 *
 * 用 Zod 定义 schema，首次引用即校验，缺失/非法早报错，避免在请求链路深处静默
 * 失败。仅供 Node 服务端（RSC / route handler / server action）使用 —— `server-only`
 * 阻止其被 client 或 Edge 运行时引入。
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  // Better Auth / OAuth
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Resend（OTP 邮件）
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),
  // Mailchimp
  MAILCHIMP_API_KEY: z.string().min(1),
  MAILCHIMP_SERVER_PREFIX: z.string().min(1),
  MAILCHIMP_AUDIENCE_ID: z.string().min(1),
  // OpenAI（Ask DrRuby 代理 + 洞察文案润色）—— 秘钥仅服务端，绝不进 NEXT_PUBLIC_*
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.url().default("https://api.openai.com/v1"),
  // 日志级别
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type ServerEnv = z.infer<typeof schema>;

/** 纯校验：解析给定来源（默认 `process.env`），失败抛出列出问题项的可读错误。 */
export function parseServerEnv(
  source: Record<string, unknown> = process.env,
): ServerEnv {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

let cached: ServerEnv | null = null;

/**
 * 惰性校验并缓存 `process.env`。首次调用即校验，缺失/非法抛可读错误。
 *
 * 采用惰性而非模块级 parse，避免 `next build` 阶段因变量未注入而误报。
 */
export function serverEnv(): ServerEnv {
  if (!cached) cached = parseServerEnv();
  return cached;
}
