import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { __resetBuckets, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    __resetBuckets();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("桶 miss 时初始化为满（首请求放行，扣 1 令牌）", async () => {
    vi.setSystemTime(0);
    await expect(
      rateLimit("fresh-user", { routeTag: "ask", capacity: 5, refillRate: 1 }),
    ).resolves.toBeUndefined();
  });

  it("桶满时放行至 capacity，超阈抛 429 + Retry-After", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 3, refillRate: 1 / 3 };
    for (let i = 0; i < 3; i++) {
      await expect(rateLimit("u1", opts)).resolves.toBeUndefined();
    }
    // 第 4 次超阈
    await expect(rateLimit("u1", opts)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      headers: { "Retry-After": "3" }, // ceil(1 / (1/3)) = 3
    });
  });

  it("429 错误是 AppError 实例", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 1, refillRate: 1 };
    await rateLimit("u-instance", opts);
    await expect(rateLimit("u-instance", opts)).rejects.toBeInstanceOf(AppError);
  });

  it("令牌按 refillRate 平滑补充（capacity=1, 1 令牌/秒）", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 1, refillRate: 1 };
    await rateLimit("u-refill", opts); // 桶空
    await expect(rateLimit("u-refill", opts)).rejects.toThrow(AppError);

    vi.advanceTimersByTime(1000); // 1 秒后补 1 令牌
    await expect(rateLimit("u-refill", opts)).resolves.toBeUndefined();

    // 又空；500ms 不足补 1 令牌（0.5 < 1）→ 仍 429
    await expect(rateLimit("u-refill", opts)).rejects.toThrow(AppError);
    vi.advanceTimersByTime(500);
    await expect(rateLimit("u-refill", opts)).rejects.toThrow(AppError);
    vi.advanceTimersByTime(500); // 累计 1000ms → 1 令牌
    await expect(rateLimit("u-refill", opts)).resolves.toBeUndefined();
  });

  it("补充封顶 capacity（不会超过桶容量）", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 2, refillRate: 10 }; // 高补充率
    await rateLimit("u-cap", opts); // 桶剩 1
    await rateLimit("u-cap", opts); // 桶剩 0
    // 长时间后补充应封顶在 2，不会变成 20
    vi.advanceTimersByTime(100_000);
    await rateLimit("u-cap", opts); // 桶剩 1
    await rateLimit("u-cap", opts); // 桶剩 0
    await expect(rateLimit("u-cap", opts)).rejects.toThrow(AppError);
  });

  it("不同 userId 互不影响（各占独立桶）", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 1, refillRate: 1 };
    await rateLimit("u-a", opts); // u-a 桶空
    // u-b 是独立桶，仍满
    await expect(rateLimit("u-b", opts)).resolves.toBeUndefined();
    // u-a 仍空
    await expect(rateLimit("u-a", opts)).rejects.toThrow(AppError);
  });

  it("不同 routeTag 互不影响（同一用户不同端点独立桶）", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 1, refillRate: 1 };
    await rateLimit("u-shared", opts); // ask 桶空
    await expect(
      rateLimit("u-shared", { ...opts, routeTag: "insights-refresh" }),
    ).resolves.toBeUndefined(); // 不同桶
    await expect(
      rateLimit("u-shared", { ...opts, routeTag: "me-export" }),
    ).resolves.toBeUndefined(); // 又一个不同桶
    // ask 桶仍空
    await expect(rateLimit("u-shared", opts)).rejects.toThrow(AppError);
  });

  it("Retry-After = ceil(1/refillRate) 对不同 refillRate 正确计算", async () => {
    vi.setSystemTime(0);
    // capacity=6, refillRate=0.1 → Retry-After = ceil(1/0.1) = 10
    const opts = { routeTag: "me-export", capacity: 1, refillRate: 0.1 };
    await rateLimit("u-ra", opts); // 桶空
    await expect(rateLimit("u-ra", opts)).rejects.toMatchObject({
      headers: { "Retry-After": "10" },
    });
  });

  it("多次放行后补充再放行（跨时间窗的真实场景）", async () => {
    vi.setSystemTime(0);
    const opts = { routeTag: "ask", capacity: 3, refillRate: 1 }; // 1 令牌/秒
    // 突发 3 次
    for (let i = 0; i < 3; i++) {
      await expect(rateLimit("u-real", opts)).resolves.toBeUndefined();
    }
    // 第 4 次被拒
    await expect(rateLimit("u-real", opts)).rejects.toThrow(AppError);
    // 等 2 秒补 2 令牌
    vi.advanceTimersByTime(2000);
    await expect(rateLimit("u-real", opts)).resolves.toBeUndefined();
    await expect(rateLimit("u-real", opts)).resolves.toBeUndefined();
    await expect(rateLimit("u-real", opts)).rejects.toThrow(AppError);
  });
});
