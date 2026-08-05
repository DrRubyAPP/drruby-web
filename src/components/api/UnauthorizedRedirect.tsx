"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { onUnauthorized } from "@/lib/api";

/**
 * 顶层注册 401 处理器：session 过期/未登录时经 locale-aware 路由跳登录。
 * 渲染 null；`useEffect` 返回注销函数避免重复注册。
 */
export function UnauthorizedRedirect() {
  const router = useRouter();
  useEffect(() => {
    return onUnauthorized(() => router.push("/login"));
  }, [router]);
  return null;
}
