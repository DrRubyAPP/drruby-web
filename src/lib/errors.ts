import { NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * 应用级错误：携带机器可读 `code`、HTTP `status` 与可读 `message`。
 * 用于业务层显式抛出「对用户安全」的错误；`cause` 保留底层原因供日志。
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
    opts?: { cause?: unknown },
  ) {
    super(message, opts);
    this.name = "AppError";
    this.code = code;
    this.status = status;
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
        return NextResponse.json(
          { error: { code: e.code, message: e.message } },
          { status: e.status },
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
