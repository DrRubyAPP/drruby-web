/**
 * 轻量固定窗口限流（best-effort，单进程内存）。
 *
 * 仅用于 `/api/ask` 这类自建路由——better-auth 的 rateLimit 只覆盖 `/api/auth/*`。
 * 多实例部署下各进程各自计数、并不精确；如需强一致须换 Redis/DB（本轮不做）。
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * 判断 `key` 在当前窗口内是否仍可放行；放行则计数 +1。
 *
 * @param key 限流键（如 `ask:<userId>`）
 * @param max 窗口内最大放行次数（默认 20）
 * @param windowMs 窗口时长毫秒（默认 60_000）
 * @returns 放行 true / 超阈 false
 */
export function checkRateLimit(
  key: string,
  max = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

/** 测试用：清空所有限流桶。 */
export function __resetRateLimit(): void {
  buckets.clear();
}
