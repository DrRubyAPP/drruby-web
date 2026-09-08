import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LlmClient } from "@/lib/llm/client";
import { generateTriggerLabel } from "./llmTriggerHelper";

function mockClient(overrides: Partial<LlmClient>): LlmClient {
  return {
    isConfigured: () => true,
    chatComplete: vi.fn(async () => "The summary was refreshed."),
    ...overrides,
  };
}

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

  it("OpenAI 未配置 → 降级模板字典 + degraded 标记", async () => {
    const result = await generateTriggerLabel(
      {
        trigger: "new_record",
        contextSummary: "New lab record connected on 2026-08-27",
      },
      {
        client: mockClient({ isConfigured: () => false }),
      },
    );
    expect(result.ok).toBe(false);
    expect(result.label).toMatch(/lab|record|new/i);
    expect(result.degraded).toBe(true);
    expect(result.degradedReason).toBe("llm_unconfigured");
  });

  it("OpenAI 调用失败 → 降级模板字典 + degraded", async () => {
    const result = await generateTriggerLabel(
      {
        trigger: "health_context_update",
        contextSummary: "User updated symptoms and medications",
      },
      {
        client: mockClient({
          chatComplete: vi.fn(async () => {
            throw new Error("network down");
          }),
        }),
      },
    );
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.label).toMatch(/health context|updated/i);
    expect(result.degradedReason).toBe("network down");
  });

  it("OpenAI 返回空文案 → 降级模板 + degraded", async () => {
    const result = await generateTriggerLabel(
      {
        trigger: "others_refresh",
        contextSummary: "Others corpus refreshed",
      },
      {
        client: mockClient({ chatComplete: vi.fn(async () => " ") }),
      },
    );
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.degradedReason).toBe("llm_empty_or_internal_response");
  });

  it("OpenAI 返回 label → ok=true degraded=false", async () => {
    const client = mockClient({
      chatComplete: vi.fn(async () => "August 27 added a new lab result."),
    });
    const result = await generateTriggerLabel(
      {
        trigger: "new_record",
        contextSummary: "New lab record connected",
      },
      {
        client,
      },
    );
    expect(result.ok).toBe(true);
    expect(result.degraded).toBe(false);
    expect(result.label).toBe("August 27 added a new lab result.");
    expect(client.chatComplete).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: "system" }),
        expect.objectContaining({ role: "user" }),
      ]),
      expect.objectContaining({ timeoutMs: 8000 }),
    );
  });

  it("initial trigger → 模板字典（不调 LLM）", async () => {
    const client = mockClient({ chatComplete: vi.fn() });
    const result = await generateTriggerLabel(
      {
        trigger: "initial",
        contextSummary: "",
      },
      {
        client,
      },
    );
    expect(result.ok).toBe(false);
    expect(result.degraded).toBe(false); // initial 不算降级
    expect(result.label).toMatch(/initial|first|setup/i);
    expect(client.chatComplete).not.toHaveBeenCalled();
  });

  it("未知 trigger → 通用 fallback 文案（LLM 路径仍走，未配置则 degraded）", async () => {
    // 使用 cast 绕过 schema 校验以测试 fallback 路径
    const result = await generateTriggerLabel(
      {
        trigger: "unknown_trigger" as never,
        contextSummary: "",
      },
      {
        client: mockClient({ isConfigured: () => false }),
      },
    );
    expect(result.ok).toBe(false);
    // unknown trigger 走 LLM 路径；未配置 → degraded=true（与 known trigger 一致）
    expect(result.degraded).toBe(true);
    expect(result.label).toBeTruthy(); // GENERIC_FALLBACK 兜底
  });
});
