import { beforeEach, describe, expect, it, vi } from "vitest";
import { asAnonymous, asUser } from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

// 隔离生成逻辑——编排/降级已在 generate.test.ts 覆盖，这里只验 route 契约。
const generate = vi.fn();
vi.mock("@/lib/insights/generate", () => ({
  generateBodyInsights: (userId: string) => generate(userId),
}));

describe("POST /api/insights/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generate.mockResolvedValue({ attention: 2, agingVelocity: 1 });
  });

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const res = await POST();
    expect(res.status).toBe(401);
    expect(generate).not.toHaveBeenCalled();
  });

  it("已登录 → 200 返回各 kind 写入计数", async () => {
    const { POST } = await import("./route");
    asUser("u-refresh");
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ attention: 2, agingVelocity: 1 });
    expect(generate).toHaveBeenCalledWith("u-refresh");
  });
});
