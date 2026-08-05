"use client";

import { useCallback, useState } from "react";
import { ApiError, notifyUnauthorized } from "@/lib/api";

export interface UseMutationResult<TIn, TOut> {
  mutate: (input: TIn) => Promise<TOut | undefined>;
  loading: boolean;
  error: ApiError | null;
  reset: () => void;
}

/**
 * 写路径 hook：包裹一个返回 Promise 的写函数（通常是 `apiClient.post` 等）。
 * `mutate` 成功触发 `onSuccess`；失败设 `error`（401 → `notifyUnauthorized()`）。
 * 本轮样板为只读，本 hook 交付 + 单测，页面用与否不强制。
 */
export function useMutation<TIn, TOut>(
  fn: (input: TIn) => Promise<TOut>,
  opts?: { onSuccess?: (out: TOut) => void },
): UseMutationResult<TIn, TOut> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  const mutate = useCallback(
    async (input: TIn): Promise<TOut | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const out = await fn(input);
        opts?.onSuccess?.(out);
        return out;
      } catch (e) {
        const err =
          e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
        if (err.status === 401) notifyUnauthorized();
        setError(err);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [fn, opts],
  );

  return { mutate, loading, error, reset };
}
