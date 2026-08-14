import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

/**
 * 应用级错误：携带机器可读 `code`、HTTP `status` 与可读 `message`。
 * 用于业务层显式抛出「对用户安全」的错误；`cause` 保留底层原因供日志。
 * `headers` 可选字段允许错误向响应注入额外头（如 429 的 `Retry-After`）。
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly headers?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    status = 400,
    opts?: { cause?: unknown; headers?: Record<string, string> },
  ) {
    super(message, opts);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.headers = opts?.headers;
  }
}

/**
 * route handler 包装器：捕获异常 → 记日志（pino）→ 返回对用户安全的错误响应
 * （不泄露内部细节）。适用于 route handler / server action。
 *
 * 作为后续新代码的标准；不回头重构现有 auth/API 代码。
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response> | Response,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AppError) {
        logger.warn({ code: e.code, err: e }, e.message);
        const res = NextResponse.json(
          { error: { code: e.code, message: e.message } },
          { status: e.status },
        );
        if (e.headers) {
          for (const [k, v] of Object.entries(e.headers)) res.headers.set(k, v);
        }
        return res;
      }
      // 入参校验失败（route 内 `*Body.parse()`）→ 统一 400，携带字段级 issues
      if (e instanceof ZodError) {
        logger.warn({ err: e }, "Validation error");
        return NextResponse.json(
          {
            error: {
              code: "validation_error",
              message: "请求参数不合法",
              issues: e.issues,
            },
          },
          { status: 400 },
        );
      }
      logger.error({ err: e }, "Unhandled error");
      return NextResponse.json(
        { error: { code: "internal_error", message: "Something went wrong." } },
        { status: 500 },
      );
    }
  };
}
