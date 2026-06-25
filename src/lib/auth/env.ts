/**
 * 认证相关环境变量的集中读取与校验。
 *
 * Better Auth / Google OAuth / Resend 所需变量在此统一校验，缺失时尽早抛出
 * 可读错误，避免在请求链路深处静默失败。
 */
const REQUIRED = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

export type AuthEnv = Record<(typeof REQUIRED)[number], string>;

export function getAuthEnv(): AuthEnv {
  const out = {} as AuthEnv;
  for (const key of REQUIRED) {
    const v = process.env[key];
    if (!v) throw new Error(`Missing required auth env: ${key}`);
    out[key] = v;
  }
  return out;
}
