import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBodyInsightInput } from "@/lib/db/repositories/bodyInsight.repo";
import type { LlmClient } from "@/lib/llm/client";

// mock DB 层：隔离真实库，只关注编排与降级逻辑。
const listSignals = vi.fn();
const listTimeline = vi.fn();
const listDecisions = vi.fn();
const replace = vi.fn(
  async (_u: string, _k: string, inputs: CreateBodyInsightInput[]) =>
    inputs.length,
);

vi.mock("@/lib/db", () => ({
  signalRepo: { listByUser: (u: string) => listSignals(u) },
  timelineEventRepo: { listByUser: (u: string) => listTimeline(u) },
  decisionRepo: { listByUser: (u: string) => listDecisions(u) },
  bodyInsightRepo: {
    replaceByUserAndKind: (u: string, k: string, i: CreateBodyInsightInput[]) =>
      replace(u, k, i),
  },
}));

/** 记录最后一次调用的可注入 llm。 */
function fakeLlm(opts: {
  configured: boolean;
  complete?: (messages: unknown) => Promise<string>;
}): LlmClient & { calls: number } {
  const c = {
    calls: 0,
    isConfigured: () => opts.configured,
    async chatComplete(messages: unknown) {
      c.calls++;
      if (!opts.complete) throw new Error("not configured to complete");
      return opts.complete(messages);
    },
  };
  return c;
}

/** 取某 kind 那次 replace 调用传入的 inputs。 */
function inputsForKind(kind: string): CreateBodyInsightInput[] {
  const call = replace.mock.calls.find((c) => c[1] === kind);
  if (!call) throw new Error(`replace 未按 kind=${kind} 调用`);
  return call[2] as CreateBodyInsightInput[];
}

describe("generateBodyInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSignals.mockResolvedValue([
      {
        id: "s1",
        userId: "u1",
        label: "雌激素",
        value: "42",
        unit: "pg/mL",
        source: "lab",
        confidence: "observed",
        trend: "down",
        measuredAt: new Date("2026-08-01"),
        createdAt: new Date("2026-08-01"),
      },
    ]);
    listTimeline.mockResolvedValue([]);
    listDecisions.mockResolvedValue([]);
  });

  it("缺 key（isConfigured=false）→ 不调 LLM，写规则原文，replace 调两次", async () => {
    const { generateBodyInsights } = await import("./generate");
    const llm = fakeLlm({ configured: false });

    const counts = await generateBodyInsights("u1", { llm });

    expect(llm.calls).toBe(0);
    expect(replace).toHaveBeenCalledTimes(2);
    expect(counts.attention).toBe(1);
    expect(counts.agingVelocity).toBe(1);
    // 规则原文（未润色）
    expect(inputsForKind("attention")[0].title).toBe("雌激素 最近走低");
    // 数值/枚举来自规则
    expect(inputsForKind("attention")[0].accent).toBe("amber");
    expect(inputsForKind("aging_velocity")[0].tone).toBe("amber");
  });

  it("chatComplete 抛错 → 降级规则原文，整体不失败", async () => {
    const { generateBodyInsights } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async () => {
        throw new Error("upstream 502");
      },
    });

    const counts = await generateBodyInsights("u1", { llm });

    expect(llm.calls).toBe(1);
    expect(counts.attention).toBe(1);
    expect(inputsForKind("attention")[0].title).toBe("雌激素 最近走低");
  });

  it("正常润色 → 使用 LLM 文案，但数值/accent 仍由规则决定", async () => {
    const { generateBodyInsights } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async () =>
        JSON.stringify([{ title: "温和提示：雌激素", body: "润色后的正文" }]),
    });

    await generateBodyInsights("u1", { llm });

    const attention = inputsForKind("attention")[0];
    expect(attention.title).toBe("温和提示：雌激素");
    expect(attention.body).toBe("润色后的正文");
    expect(attention.accent).toBe("amber"); // 规则定，LLM 不改
  });

  it("LLM 返回条数不符 → 丢弃润色，回退原文", async () => {
    const { generateBodyInsights } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async () => JSON.stringify([]), // 长度不匹配
    });

    await generateBodyInsights("u1", { llm });

    expect(inputsForKind("attention")[0].title).toBe("雌激素 最近走低");
  });

  it("无数据用户 → attention 空集，aging 仍写 purple 兜底，不报错", async () => {
    listSignals.mockResolvedValue([]);
    listDecisions.mockResolvedValue([]);
    const { generateBodyInsights } = await import("./generate");
    const llm = fakeLlm({ configured: false });

    const counts = await generateBodyInsights("u1", { llm });

    expect(counts.attention).toBe(0);
    expect(counts.agingVelocity).toBe(1);
    expect(inputsForKind("aging_velocity")[0].tone).toBe("purple");
  });
});
