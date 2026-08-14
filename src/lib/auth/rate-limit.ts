import { AppError } from "@/lib/errors";

/**
 * 路由内令牌桶限流守卫——在 `requireUser()` 之后调用。
 *
 * 单进程内存桶（best-effort）：多实例部署下各进程独立计数、不精确；
 * 生产强一致需 Redis（后续 task）。
 *
 * key = `${routeTag}:${userId}`：同一用户多设备共享桶，符合 per-user 总预算语义。
 */
export type RateLimitOpts = {
  /** 桶 key 前缀，如 "ask" / "insights-refresh" / "me-export"。 */
  routeTag: string;
  /** 桶容量（最大突发）。 */
  capacity: number;
  /** 令牌补充速率（令牌/秒）。 */
  refillRate: number;
};

type Bucket = { tokens: number; lastRefill: number };

const buckets = new Map<string, Bucket>();

/**
 * 路由内守卫：超阈抛 `AppError("RATE_LIMITED", 429)`，携带
 * `Retry-After: ceil(1/refillRate)` 头；放行时静默扣 1 令牌。
 *
 * 同步代码块天然原子（JS 单线程），无需锁。
 */
export async function rateLimit(
  userId: string,
  opts: RateLimitOpts,
): Promise<void> {
  const key = `${opts.routeTag}:${userId}`;
  const now = Date.now();

  const b = buckets.get(key);
  if (!b) {
    // 桶 miss：初始化为满，本次扣 1 → 剩 capacity - 1
    buckets.set(key, { tokens: opts.capacity - 1, lastRefill: now });
    return;
  }

  // 按时间补充令牌，封顶 capacity
  const refilled = Math.min(
    opts.capacity,
    b.tokens + ((now - b.lastRefill) / 1000) * opts.refillRate,
  );

  if (refilled < 1) {
    // 超阈：429 + Retry-After
    const retryAfter = Math.ceil(1 / opts.refillRate);
    throw new AppError("RATE_LIMITED", "请求过于频繁，请稍后再试", 429, {
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  buckets.set(key, { tokens: refilled - 1, lastRefill: now });
}

/** 测试用：清空所有桶。 */
export function __resetBuckets(): void {
  buckets.clear();
}
