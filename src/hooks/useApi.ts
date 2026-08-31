"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchJson, notifyUnauthorized } from "@/lib/api";

export interface UseApiResult<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * mount 自动取数的最小读 hook。`path` 变化重取；`refetch()` 手动重取；
 * 每次请求用局部 `cancelled` 旗标，卸载/切换后不 setState（防竞态）。
 * `path` 传 `null` 表示暂不取数（loading=false）。捕获 401 → `notifyUnauthorized()`。
 *
 * refetch（nonce 触发）不清空已有数据、不回到 loading——消费方（如决策详情页）
 * 会因整页骨架屏替换导致滚动跳顶；path 切换仍清数据并进入 loading。
 */
export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(path != null);
  const [nonce, setNonce] = useState(0);
  // 已取数的 path；用于区分「path 切换」（清数据 + loading）与「refetch」（保留旧数据）
  const fetchedPath = useRef<string | null>(null);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (path == null) {
      fetchedPath.current = null;
      setLoading(false);
      return;
    }
    let cancelled = false;
    if (fetchedPath.current !== path) {
      fetchedPath.current = path;
      setData(null);
      setError(null);
      setLoading(true);
    } else {
      setError(null);
    }
    fetchJson<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (cancelled) return;
        const err =
          e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
        if (err.status === 401) notifyUnauthorized();
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  return { data, error, loading, refetch };
}
