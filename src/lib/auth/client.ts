"use client";

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * 浏览器端 Better Auth 客户端。
 *
 * baseURL 留空，默认指向同源 `/api/auth`。emailOTP 插件提供
 * `emailOtp.sendVerificationOtp` 与 `signIn.emailOtp`。
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const { signIn, signOut, useSession } = authClient;
