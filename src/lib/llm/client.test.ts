import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

// 可变 env：各测试按需改写 OPENAI_* 字段，覆盖「已配置 / 缺 key」两类路径。
const mockEnv = {
  OPENAI_API_KEY: "sk-test",
  OPENAI_MODEL: "gpt-4o-mini",
  OPENAI_BASE_URL: "https://api.openai.com/v1",
};

vi.mock("@/config/env", () => ({
  serverEnv: () => mockEnv,
}));

// 延迟 import：确保 mock 生效后再取被测模块。
const { openAiClient } = await import("@/lib/llm/client");

function okResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as unknown as Response;
}

describe("openAiClient", () => {
  beforeEach(() => {
    mockEnv.OPENAI_API_KEY = "sk-test";
    mockEnv.OPENAI_MODEL = "gpt-4o-mini";
    mockEnv.OPENAI_BASE_URL = "https://api.openai.com/v1";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns assistant content on 2xx", async () => {
    const fetchMock = vi.fn(async () => okResponse("hello from ai"));
    vi.stubGlobal("fetch", fetchMock);

    const out = await openAiClient.chatComplete([
      { role: "user", content: "hi" },
    ]);

    expect(out).toBe("hello from ai");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-test",
    );
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("throws LLM_UNCONFIGURED (503) when the key is missing", async () => {
    mockEnv.OPENAI_API_KEY = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openAiClient.chatComplete([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({ code: "LLM_UNCONFIGURED", status: 503 });
    // 缺 key 时绝不触达上游。
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws LLM_UPSTREAM (502) on a non-2xx response", async () => {
    const fetchMock = vi.fn(
      async () => ({ ok: false, status: 500 }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openAiClient.chatComplete([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({ code: "LLM_UPSTREAM", status: 502 });
  });

  it("wraps fetch/network errors as LLM_UPSTREAM (502) without leaking cause message", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("ECONNRESET upstream-secret-detail");
    });
    vi.stubGlobal("fetch", fetchMock);

    const err = await openAiClient
      .chatComplete([{ role: "user", content: "hi" }])
      .catch((e) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("LLM_UPSTREAM");
    expect(err.status).toBe(502);
    // 对用户安全的 message 不泄漏上游细节。
    expect(err.message).not.toContain("upstream-secret-detail");
  });

  it("isConfigured reflects presence of the key", () => {
    expect(openAiClient.isConfigured()).toBe(true);
    mockEnv.OPENAI_API_KEY = "";
    expect(openAiClient.isConfigured()).toBe(false);
  });

  describe("onUsage（token 成本记账，task-26）", () => {
    it("上游返回 usage → onUsage 收到真实 token 数", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            ({
              ok: true,
              json: async () => ({
                choices: [{ message: { content: "ok" } }],
                usage: { prompt_tokens: 120, completion_tokens: 30 },
              }),
            }) as unknown as Response,
        ),
      );
      const onUsage = vi.fn();

      const out = await openAiClient.chatComplete(
        [{ role: "user", content: "hi" }],
        { onUsage },
      );

      expect(out).toBe("ok");
      expect(onUsage).toHaveBeenCalledWith({
        promptTokens: 120,
        completionTokens: 30,
      });
    });

    it("上游无 usage → onUsage 不被调用，返回值不受影响", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => okResponse("ok")),
      );
      const onUsage = vi.fn();

      const out = await openAiClient.chatComplete(
        [{ role: "user", content: "hi" }],
        { onUsage },
      );

      expect(out).toBe("ok");
      expect(onUsage).not.toHaveBeenCalled();
    });

    it("不传 onUsage → 行为与旧版一致", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            ({
              ok: true,
              json: async () => ({
                choices: [{ message: { content: "ok" } }],
                usage: { prompt_tokens: 1, completion_tokens: 2 },
              }),
            }) as unknown as Response,
        ),
      );

      await expect(
        openAiClient.chatComplete([{ role: "user", content: "hi" }]),
      ).resolves.toBe("ok");
    });
  });
});
