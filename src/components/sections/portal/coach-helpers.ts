import type { ApiError } from "@/lib/api";

export type ApiMessage = { role: "user" | "assistant"; content: string };

/**
 * 把当前会话消息映射为 /api/ask 入参 messages：
 * 仅保留真实 user/explain 往返（typing 占位、错误气泡、insight/system 不参与）。
 * 入参放宽为 `{ type: string; content: string }`，兼容扩展类型（typing/error 等）。
 */
export function toApiMessages(
  messages: ReadonlyArray<{ type: string; content: string }>,
): ApiMessage[] {
  return messages
    .filter(
      (m): m is { type: "user" | "explain"; content: string } =>
        m.type === "user" || m.type === "explain",
    )
    .map((m) => ({
      role: m.type === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));
}

const FRIENDLY: Record<string, string> = {
  LLM_UNCONFIGURED: "DrRuby 暂时无法响应，请稍后再试",
  LLM_UPSTREAM: "DrRuby 暂时无法响应，请稍后再试",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  network_error: "网络异常，请检查后重试",
};

/** 按 ApiError code 映射为对用户安全的友好文案，不泄漏后端 message。 */
export function toErrorMessage(err: ApiError): string {
  if (FRIENDLY[err.code]) return FRIENDLY[err.code];
  if (err.status >= 500) return "DrRuby 暂时无法响应，请稍后再试";
  return "发生未知错误，请重试";
}
