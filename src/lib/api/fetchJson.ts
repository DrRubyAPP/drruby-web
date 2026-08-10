import { ApiError } from "@/lib/api/errors";
import { clearBearerToken, getBearerToken } from "@/lib/auth/token";

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // 非 JSON 错误体（HTML 错误页等）——走 status 兜底
  }
  const e = (
    body as {
      error?: { code?: string; message?: string; issues?: unknown[] };
    } | null
  )?.error;
  if (e?.code && e?.message) {
    return new ApiError(e.code, res.status, e.message, e.issues);
  }
  return new ApiError("http_error", res.status, `请求失败（${res.status}）`);
}

/**
 * 同源 JSON 取数。成功 2xx → 解析返回 `T`；204/空体 → `null`。
 * 失败统一归一化为 `ApiError`（不裸抛 fetch 异常）。401 只抛，导航由上层处理。
 */
export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    // 后端数据 API 仅认 bearer 通道：附上本地存储的 token（无则仅靠 cookie 也会 401）。
    const token = getBearerToken();
    res = await fetch(path, {
      credentials: "include",
      ...init,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("network_error", 0, "网络异常，请稍后重试");
  }

  // 401：session 过期 / 软删 / token 失效 → 清本地 token，触发上层重登跳转。
  if (res.status === 401) {
    clearBearerToken();
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) return null as T;

  const text = await res.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("invalid_json", res.status, "响应解析失败");
  }
}
