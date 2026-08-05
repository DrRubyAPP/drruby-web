/**
 * 客户端 API 错误：归一化服务端 `handle()` 的 `{error:{code,message,issues?}}`，
 * 以及网络/解析类失败。`status` 为 HTTP 状态码；网络错误约定 `status = 0`。
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly issues?: unknown[];

  constructor(
    code: string,
    status: number,
    message: string,
    issues?: unknown[],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.issues = issues;
  }
}
