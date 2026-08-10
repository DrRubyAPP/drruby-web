"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import {
  clearBearerToken,
  getBearerToken,
  setBearerToken,
} from "@/lib/auth/token";

/**
 * 全局静默引导：保证 Web 端持有可用的 bearer token。
 *
 * 后端数据 API 已禁 cookie（仅认 `Authorization: Bearer`）。email OTP 登录时
 * `authClient` 全局 `onSuccess` 已从 `set-auth-token` 头存好 token；但以下两类
 * 场景本地没有 token：
 *   1. Google 整页重定向登录——回调不经客户端 fetch，捕获不到 `set-auth-token`；
 *   2. 页面刷新——内存态丢失，但 cookie session 仍在。
 *
 * 本组件借 cookie session（`useSession`，SSR 守卫同款通道）判断是否已登录；若已登录
 * 但本地无 bearer token，则向 `/api/auth/token` 换发并存储。已登录态变化 / token
 * 滑动续期（session.token 变化）时重跑。登出（session 明确为空且非 pending）清本地 token。
 * 渲染空，仅做副作用。
 */
export function TokenBootstrap() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    // 已登出：清掉可能残留的 token。
    if (!session?.session) {
      if (getBearerToken()) clearBearerToken();
      return;
    }

    // 已登录且有 token：无需动作。
    if (getBearerToken()) return;

    // 已登录但无 token：用 cookie session 换发 bearer。
    fetch("/api/auth/token", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { token?: string } | null) => {
        const token = body?.token;
        if (token) setBearerToken(token);
      })
      .catch(() => {
        /* 换发失败不阻塞；下次请求 401 再走重登闭环 */
      });
  }, [isPending, session?.session, session?.session?.token]);

  return null;
}
