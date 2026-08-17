import "server-only";
import { serverEnv } from "@/config/env";
import { AppError } from "@/lib/errors";

/**
 * OpenAI 兼容的服务端 LLM 客户端。
 *
 * 秘钥仅服务端持有（经 `serverEnv()` Zod 校验），绝不下发 App/进 `NEXT_PUBLIC_*`。
 * 客户端接口 `LlmClient` 便于单测注入 mock —— 单测不打真实上游。
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 上游 usage 记账（仅 token 数，不含任何内容/PII）。 */
export interface LlmUsage {
  promptTokens?: number;
  completionTokens?: number;
}

export interface LlmClient {
  /** 单发补全，返回 assistant 文本内容（无内容时返回空串）。 */
  chatComplete(
    messages: ChatMessage[],
    opts?: {
      timeoutMs?: number;
      /** 上游返回 usage 时回调真实 token 数（成本记账用，可选、非破坏）。 */
      onUsage?: (usage: LlmUsage) => void;
    },
  ): Promise<string>;
  /** 是否配置了 key —— 供洞察润色「缺 key 降级规则原文」判断，不抛错。 */
  isConfigured(): boolean;
}

/** 生产 client：fetch 直连 OpenAI 兼容 `/chat/completions`。 */
export const openAiClient: LlmClient = {
  isConfigured() {
    try {
      return Boolean(serverEnv().OPENAI_API_KEY);
    } catch {
      return false;
    }
  },

  async chatComplete(messages, opts) {
    const env = serverEnv();
    if (!env.OPENAI_API_KEY) {
      throw new AppError("LLM_UNCONFIGURED", "AI 服务未配置", 503);
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 20_000);
    try {
      const res = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: env.OPENAI_MODEL, messages }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        // 不泄漏上游状态/响应体细节；对用户安全的通用文案。
        throw new AppError("LLM_UPSTREAM", "AI 服务暂不可用", 502);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      if (opts?.onUsage && json.usage) {
        opts.onUsage({
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
        });
      }
      return json.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      if (e instanceof AppError) throw e;
      // 超时/网络错误等：包装为标准上游错误，`cause` 仅供日志、不进用户 message。
      throw new AppError("LLM_UPSTREAM", "AI 服务暂不可用", 502, { cause: e });
    } finally {
      clearTimeout(timer);
    }
  },
};
