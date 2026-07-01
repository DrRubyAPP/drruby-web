/**
 * 认证相关环境变量的读取。
 *
 * 现委托 `src/config/env.ts` 的统一 Zod 校验；保留 `getAuthEnv` 同名同形导出，
 * 调用点无需改动。
 */
import { serverEnv } from "@/config/env";

export type AuthEnv = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
};

export function getAuthEnv(): AuthEnv {
  const e = serverEnv();
  return {
    BETTER_AUTH_SECRET: e.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: e.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: e.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: e.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: e.RESEND_API_KEY,
    EMAIL_FROM: e.EMAIL_FROM,
  };
}
