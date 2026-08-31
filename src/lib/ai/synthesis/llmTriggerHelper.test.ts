import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateTriggerLabel } from "./llmTriggerHelper";

describe("llmTriggerHelper", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("LLM_TRIGGER_API_KEY 缺失 → 降级模板字典 + degraded 标记", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "");
    const result = await generateTriggerLabel({
      trigger: "new_record",
      contextSummary: "New lab record connected on 2026-08-27",
    });
    expect(result.ok).toBe(false);
    expect(result.label).toMatch(/lab|record|new/i);
    expect(result.degraded).toBe(true);
  });

  it("LLM 调用 fetch 失败 → 降级模板字典 + degraded", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "fake-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );
    const result = await generateTriggerLabel({
      trigger: "health_context_update",
      contextSummary: "User updated symptoms and medications",
    });
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.label).toMatch(/health context|updated/i);
  });

  it("LLM 调用非 200 → 降级模板 + degraded", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "fake-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: "internal" }),
        }),
      ) as unknown as typeof fetch,
    );
    const result = await generateTriggerLabel({
      trigger: "others_refresh",
      contextSummary: "Others corpus refreshed",
    });
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(true);
  });

  it("LLM 调用 200 + 返回 label → ok=true degraded=false", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "fake-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ label: "August 27 added a new lab result." }),
        }),
      ) as unknown as typeof fetch,
    );
    const result = await generateTriggerLabel({
      trigger: "new_record",
      contextSummary: "New lab record connected",
    });
    expect(result.ok).toBe(true);
    expect(result.degraded).toBe(false);
    expect(result.label).toBe("August 27 added a new lab result.");
  });

  it("initial trigger → 模板字典（不调 LLM）", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "fake-key");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy as unknown as typeof fetch);
    const result = await generateTriggerLabel({
      trigger: "initial",
      contextSummary: "",
    });
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(false); // initial 不算降级
    expect(result.label).toMatch(/initial|first|setup/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("未知 trigger → 通用 fallback 文案（LLM 路径仍走，无 key 则 degraded）", async () => {
    vi.stubEnv("LLM_TRIGGER_API_KEY", "");
    // 使用 cast 绕过 schema 校验以测试 fallback 路径
    const result = await generateTriggerLabel({
      trigger: "unknown_trigger" as never,
      contextSummary: "",
    });
    expect(result.ok).toBe(false);
    // unknown trigger 走 LLM 路径；无 API key → degraded=true（与 known trigger 一致）
    expect(result.degraded).toBe(true);
    expect(result.label).toBeTruthy(); // GENERIC_FALLBACK 兜底
  });
});
