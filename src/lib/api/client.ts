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

  /**
   * multipart/form-data 上传：直接把 FormData 交给 fetch，
   * **不设 Content-Type**（浏览器自动补带 boundary 的 multipart 头）。
   */
  postForm: <T>(path: string, form: FormData, init?: RequestInit) =>
    fetchJson<T>(path, { ...init, method: "POST", body: form }),

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
