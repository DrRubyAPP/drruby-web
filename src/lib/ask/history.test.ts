import { beforeEach, describe, expect, it, vi } from "vitest";

// 纯规则单测：mock DB 层，只验拼串与空数据分支，不连真实库。
const listDecisions = vi.fn();
const listSignals = vi.fn();
const listTimeline = vi.fn();

vi.mock("@/lib/db", () => ({
  decisionRepo: { listByUser: (id: string) => listDecisions(id) },
  signalRepo: { listByUser: (id: string) => listSignals(id) },
  timelineEventRepo: { listByUser: (id: string) => listTimeline(id) },
}));

const { buildHistorySummary } = await import("./history");

describe("buildHistorySummary", () => {
  beforeEach(() => {
    listDecisions.mockReset().mockResolvedValue([]);
    listSignals.mockReset().mockResolvedValue([]);
    listTimeline.mockReset().mockResolvedValue([]);
  });

  it("无任何数据 → null（调用方省略该 system 消息）", async () => {
    expect(await buildHistorySummary("u1")).toBeNull();
  });

  it("拼接 decisions/signals/timeline 三段", async () => {
    listDecisions.mockResolvedValue([
      { question: "要不要停用避孕药", lifecycle: "ACTIVE" },
    ]);
    listSignals.mockResolvedValue([
      {
        label: "雌激素",
        value: "42",
        unit: "pg/mL",
        trend: "up",
        confidence: "high",
      },
    ]);
    listTimeline.mockResolvedValue([{ title: "开始记录周期" }]);

    const out = await buildHistorySummary("u1");
    expect(out).not.toBeNull();
    expect(out).toContain("用户个人史");
    expect(out).toContain("近期决策：要不要停用避孕药(ACTIVE)");
    expect(out).toContain("关键信号：雌激素=42(up)[high]");
    expect(out).toContain("近期记录：开始记录周期");
  });

  it("trend 为空时省略括号", async () => {
    listSignals.mockResolvedValue([
      { label: "睡眠", value: "6.5h", trend: null, confidence: "low" },
    ]);
    const out = await buildHistorySummary("u1");
    expect(out).toContain("睡眠=6.5h[low]");
    expect(out).not.toContain("()");
  });

  it("每类最多 5 条", async () => {
    listDecisions.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({
        question: `q${i}`,
        lifecycle: "ACTIVE",
      })),
    );
    const out = await buildHistorySummary("u1");
    expect(out).toContain("q4");
    expect(out).not.toContain("q5");
  });
});
