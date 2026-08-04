import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimit, checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimit();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("窗口内放行至 max，超阈返回 false", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("k", 3, 1000)).toBe(true);
    }
    expect(checkRateLimit("k", 3, 1000)).toBe(false);
  });

  it("窗口过期后计数重置", () => {
    expect(checkRateLimit("k", 1, 1000)).toBe(true);
    expect(checkRateLimit("k", 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(checkRateLimit("k", 1, 1000)).toBe(true);
  });

  it("不同 key 互不影响", () => {
    expect(checkRateLimit("a", 1, 1000)).toBe(true);
    expect(checkRateLimit("a", 1, 1000)).toBe(false);
    expect(checkRateLimit("b", 1, 1000)).toBe(true);
  });
});
