import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LlmClient, LlmUsage } from "@/lib/llm/client";

// mock DB 层：隔离真实库，只关注编排、润色与降级逻辑（模式对齐 insights/generate.test.ts）
const findLatestScan = vi.fn();
const listHormoneReadings = vi.fn();
const listAttention = vi.fn();
const listAging = vi.fn();
const createReport = vi.fn(
  async (_u: string, input: Record<string, unknown>) => input,
);

vi.mock("@/lib/db", () => ({
  skinScanRepo: { findLatest: (u: string) => findLatestScan(u) },
  hormoneReadingRepo: { listByUser: (u: string) => listHormoneReadings(u) },
  bodyInsightRepo: {
    listByUserAndKind: (u: string, k: string) =>
      k === "attention" ? listAttention(u) : listAging(u),
  },
  aiReportRepo: {
    create: (u: string, input: Record<string, unknown>) =>
      createReport(u, input),
  },
}));

/** 可注入 fake LLM：支持 opts.onUsage 回调（对齐扩展后的 LlmClient 接口） */
function fakeLlm(opts: {
  configured: boolean;
  complete?: (
    messages: unknown,
    opts?: { onUsage?: (usage: LlmUsage) => void },
  ) => Promise<string>;
}): LlmClient & { calls: number } {
  const c = {
    calls: 0,
    isConfigured: () => opts.configured,
    async chatComplete(
      messages: unknown,
      callOpts?: { onUsage?: (usage: LlmUsage) => void },
    ) {
      c.calls++;
      if (!opts.complete) throw new Error("not configured to complete");
      return opts.complete(messages, callOpts);
    },
  };
  return c;
}

const SCAN = {
  id: "scan-1",
  headline: "整体平稳，局部需关注。",
  zones: [
    { name: "额头", status: "stable" },
    { name: "下颌线", status: "concern" },
  ],
};

describe("generateAiReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findLatestScan.mockResolvedValue(SCAN);
    listHormoneReadings.mockResolvedValue([
      { marker: "雌激素", value: "42 pg/mL", phase: "卵泡期", note: "平稳" },
    ]);
    listAttention.mockResolvedValue([]);
    listAging.mockResolvedValue([]);
  });

  it("skin + 缺 key → 不调 LLM，落规则原文，meta.degraded=true", async () => {
    const { generateAiReport } = await import("./generate");
    const llm = fakeLlm({ configured: false });

    const input = await generateAiReport("u1", "skin", { llm });

    expect(llm.calls).toBe(0);
    expect(createReport).toHaveBeenCalledTimes(1);
    expect(input.title).toBe("皮肤状态报告");
    expect(input.summary).toBe("整体平稳，局部需关注。");
    const findings = input.findings as { level: string; tag: string }[];
    expect(findings.map((f) => f.level)).toEqual(["good", "alert"]);
    expect((input.meta as { degraded: boolean }).degraded).toBe(true);
    expect(input.meta).not.toHaveProperty("llm");
  });

  it("正常润色 + usage → 润色文案落库，level/tag 保持规则值，meta.llm 记 token", async () => {
    const { generateAiReport } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async (_m, callOpts) => {
        callOpts?.onUsage?.({ promptTokens: 100, completionTokens: 40 });
        return JSON.stringify({
          title: "温和版皮肤报告",
          summary: "整体稳定的皮肤状态。",
          findings: [
            { title: "额头状态平稳", desc: "额头近期表现稳定。" },
            { title: "下颌线建议关注", desc: "下颌线近期有波动。" },
          ],
        });
      },
    });

    const input = await generateAiReport("u1", "skin", { llm });

    expect(llm.calls).toBe(1);
    expect(input.title).toBe("温和版皮肤报告");
    expect(input.summary).toBe("整体稳定的皮肤状态。");
    const findings = input.findings as {
      level: string;
      tag: string;
      title: string;
    }[];
    // level/tag 由规则定，LLM 不改
    expect(findings.map((f) => f.level)).toEqual(["good", "alert"]);
    expect(findings.map((f) => f.tag)).toEqual(["额头", "下颌线"]);
    expect(findings[0].title).toBe("额头状态平稳");
    expect((input.meta as { degraded: boolean }).degraded).toBe(false);
    expect((input.meta as unknown as { llm: LlmUsage }).llm).toEqual({
      promptTokens: 100,
      completionTokens: 40,
    });
    expect(input.meta).toHaveProperty("generatedAt");
  });

  it("chatComplete 抛错 → 降级规则原文，degraded=true，整体不失败", async () => {
    const { generateAiReport } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async () => {
        throw new Error("upstream 502");
      },
    });

    const input = await generateAiReport("u1", "skin", { llm });

    expect(input.title).toBe("皮肤状态报告");
    expect((input.meta as { degraded: boolean }).degraded).toBe(true);
  });

  it("LLM 返回条数不符 → 丢弃润色回退原文，degraded=true", async () => {
    const { generateAiReport } = await import("./generate");
    const llm = fakeLlm({
      configured: true,
      complete: async () =>
        JSON.stringify({
          title: "t",
          summary: "s",
          findings: [{ title: "只有一条", desc: "d" }], // 与 draft 2 条不符
        }),
    });

    const input = await generateAiReport("u1", "skin", { llm });

    expect(input.title).toBe("皮肤状态报告");
    expect((input.meta as { degraded: boolean }).degraded).toBe(true);
  });

  it("hormone 无数据 → 422 insufficient_data，不调 LLM、不落库", async () => {
    const { generateAiReport } = await import("./generate");
    listHormoneReadings.mockResolvedValue([]);
    const llm = fakeLlm({ configured: true });

    await expect(
      generateAiReport("u1", "hormone", { llm }),
    ).rejects.toMatchObject({ code: "insufficient_data", status: 422 });
    expect(llm.calls).toBe(0);
    expect(createReport).not.toHaveBeenCalled();
  });

  it("skin zones 为空 → polish 跳过（findings 空），仍落库且 degraded=true", async () => {
    const { generateAiReport } = await import("./generate");
    findLatestScan.mockResolvedValue({ ...SCAN, zones: [] });
    const llm = fakeLlm({ configured: true });

    const input = await generateAiReport("u1", "skin", { llm });

    expect(llm.calls).toBe(0); // findings.length === 0 直接降级，不浪费 token
    expect(createReport).toHaveBeenCalledTimes(1);
    expect(input.findings).toEqual([]);
    expect((input.meta as { degraded: boolean }).degraded).toBe(true);
  });

  it("body：attention + aging 汇总生成", async () => {
    const { generateAiReport } = await import("./generate");
    listAttention.mockResolvedValue([
      { title: "睡眠不足", body: "连续三天走低", accent: "red", tag: "sleep" },
    ]);
    listAging.mockResolvedValue([
      {
        title: "t",
        label: "胶原",
        value: "-12%",
        caption: "下降",
        tone: "green",
      },
    ]);
    const llm = fakeLlm({ configured: false });

    const input = await generateAiReport("u1", "body", { llm });

    expect(input.title).toBe("身体洞察报告");
    const findings = input.findings as { level: string; tag: string }[];
    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({ level: "alert", tag: "sleep" });
    expect(findings[1]).toMatchObject({ level: "good", tag: "胶原" });
  });
});
