"use client";

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { setBearerToken } from "@/lib/auth/token";

/**
 * 浏览器端 Better Auth 客户端。
 *
 * baseURL 留空，默认指向同源 `/api/auth`。emailOTP 插件提供
 * `emailOtp.sendVerificationOtp` 与 `signIn.emailOtp`。
 *
 * 全局 `fetchOptions.onSuccess`：登录等任意响应若带 `set-auth-token` 头，即把
 * bearer token 存入本地，供 Web 调用数据 API（已禁 cookie 通道）时附带。
 * Google 登录是整页重定向，回调不由本 fetch 捕获，由 `TokenBootstrap` 经
 * `/api/auth/token` 换发。
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setBearerToken(token);
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
