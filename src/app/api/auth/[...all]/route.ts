import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

// Better Auth 的全部端点（OTP 发码/校验、Google OAuth 回调、会话、登出）
// 经此 catch-all route 暴露在 /api/auth/*。
export const { GET, POST } = toNextJsHandler(auth);
