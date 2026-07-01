import type { AppError } from "./errors";

/**
 * 轻量 Result 类型：以判别联合表达成功/失败，避免异常穿透业务边界。
 * 作为后续 server action / service 层的返回约定。
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
