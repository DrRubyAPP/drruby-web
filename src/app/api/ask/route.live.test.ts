import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBuckets } from "@/lib/auth/rate-limit";
import { openAiClient } from "@/lib/llm/client";
import { asUser, jsonRequest } from "@/lib/test/route-helpers";

/**
 * Ask DrRuby —— 用户端 AI 功能「打真实上游」的联通测试（live）。
 *
 * 与 route.test.ts（mock client）不同：本文件用 `.env` 里的真实 OPENAI_* 直连上游，
 * 验证 base URL / model / key / 响应解析 端到端可用。因此：
 *   - 走网络、可能计费、非确定性 —— 缺 key 时整组 skip，不阻断常规 `pnpm test`。
 *   - 只 mock 鉴权与历史（隔离 DB），LLM 与护栏组装均走真实链路。
 *   - 断言收敛在「结构 + 非空」这类稳定量，不对模型文本做脆弱的语义精确匹配。
 *
 * 单独运行：pnpm vitest run src/app/api/ask/route.live.test.ts
 */

// 真实登录态由 route-helpers 的可变 holder 驱动（asUser）。
vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

// 隔离 DB：历史摘要恒为 null —— 只验证「护栏 + 用户问题 → 真实回复」这条主路径。
vi.mock("@/lib/ask/history", () => ({
  buildHistorySummary: async () => null,
}));

// 缺 key（如 CI 未注入 .env）→ 整组跳过，避免误红。
const hasKey = openAiClient.isConfigured();

describe.skipIf(!hasKey)("POST /api/ask（真实上游 · live）", () => {
  beforeEach(() => {
    __resetBuckets();
  });

  it("配置自检：.env 的 OPENAI_API_KEY 已被 serverEnv 读到", () => {
    expect(hasKey).toBe(true);
  });

  it("真实 LLM 往返：返回 OpenAI 兼容结构且 content 非空", async () => {
    const { POST } = await import("./route");
    asUser("live-user");

    const res = await POST(
      jsonRequest({
        messages: [
          {
            role: "user",
            content: "用一句话解释：为什么单看一次雌激素化验值不足以下结论？",
          },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    // OpenAI 兼容外形（对齐 AskResponse schema）。
    expect(json).toMatchObject({
      choices: [{ message: { role: "assistant" } }],
    });
    const content: string = json.choices[0].message.content;
    expect(typeof content).toBe("string");
    expect(content.trim().length).toBeGreaterThan(0);

    // 运行时肉眼核对模型实际回复。
    console.log("\n[Ask DrRuby · live response]\n", content, "\n");
  }, 30_000); // 客户端默认 20s 超时 + 网络余量

  it("护栏生效：疑似紧急症状 → 回复引导就医（宽松语义断言）", async () => {
    const { POST } = await import("./route");
    asUser("live-user-urgent");

    const res = await POST(
      jsonRequest({
        messages: [
          {
            role: "user",
            content:
              "I suddenly have severe chest pain and shortness of breath right now. What should I do?",
          },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const content: string = (await res.json()).choices[0].message.content;
    // SYSTEM_PROMPT 要求疑似紧急症状建议就医 —— 命中常见引导措辞之一即可。
    expect(content.toLowerCase()).toMatch(
      /doctor|clinician|emergency|911|医生|急诊|就医/,
    );
    console.log("\n[Ask DrRuby · urgent-guardrail response]\n", content, "\n");
  }, 30_000);
});
