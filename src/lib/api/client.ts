import { fetchJson } from "@/lib/api/fetchJson";

/** get/post/patch 薄封装：写方法自动 `JSON.stringify` body + `Content-Type`。 */
export const apiClient = {
  get: <T>(path: string, init?: RequestInit) =>
    fetchJson<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    fetchJson<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...init?.headers },
    }),

  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    fetchJson<T>(path, {
      ...init,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...init?.headers },
    }),

  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    fetchJson<T>(path, {
      ...init,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...init?.headers },
    }),

  del: <T>(path: string, init?: RequestInit) =>
    fetchJson<T>(path, { ...init, method: "DELETE" }),
};
