/**
 * task-43 D1 LLM 触发文案助手（Contract §23 + B6）
 *
 * 仅用于 trigger 人话文案 + 不确定性提示（synthesis 主体由模板重组）。
 * 失败降级到模板字典（provenance 标 *_degraded）；不伪装成"无证据"。
 *
 * 实现：
 * - OpenAI 兼容客户端未配置 → 自动降级（不算 LLM 调用，degraded=true）
 * - 调用失败 / 空响应 → 降级模板（degraded=true）
 * - initial trigger → 不调 LLM，模板字典（degraded=false）
 */
import type { ChangeTrigger } from "@/lib/db/enums";
import { type LlmClient, openAiClient } from "@/lib/llm/client";

export interface TriggerLabelInput {
  trigger: ChangeTrigger;
  /** 上下文摘要（如 "New lab record connected on 2026-08-27"） */
  contextSummary: string;
}

export interface TriggerLabelResult {
  /** §23 人话原因（不露原始 trigger 值） */
  label: string;
  /** LLM 是否成功生成（false=降级或未调用 LLM） */
  ok: boolean;
  /** true=LLM 失败降级模板（provenance 标 *_degraded） */
  degraded: boolean;
  /** 降级原因，仅用于服务端观测/测试，不直接展示给用户 */
  degradedReason?: string;
}

/** §23 trigger → 模板字典（保守文案，无 LLM 时的兜底） */
const TRIGGER_TEMPLATES: Record<ChangeTrigger, string> = {
  new_record: "A new health record was added — your summary was refreshed.",
  health_context_update:
    "Your health context changed — your summary was refreshed.",
  others_refresh: "Others' experiences were refreshed.",
  science_refresh: "Science evidence was refreshed.",
  observation_update: "An observation was added — your summary was refreshed.",
  initial: "Initial summary was created when you first opened this decision.",
};

const GENERIC_FALLBACK = "Your summary was refreshed based on recent changes.";

/**
 * 生成 trigger 人话文案。
 *
 * 调用顺序：
 * 1. trigger=initial → 模板字典（不调 LLM），degraded=false
 * 2. LLM 未配置 → 模板字典，degraded=true
 * 3. LLM 成功 → label=LLM 输出，ok=true，degraded=false
 * 4. LLM 失败 / 空响应 → 模板字典，degraded=true
 */
export async function generateTriggerLabel(
  input: TriggerLabelInput,
  opts: { client?: LlmClient; timeoutMs?: number } = {},
): Promise<TriggerLabelResult> {
  const templateLabel = TRIGGER_TEMPLATES[input.trigger] ?? GENERIC_FALLBACK;
  const client = opts.client ?? openAiClient;

  // initial 不调 LLM
  if (input.trigger === "initial") {
    return { label: templateLabel, ok: false, degraded: false };
  }

  if (!client.isConfigured()) {
    return {
      label: templateLabel,
      ok: false,
      degraded: true,
      degradedReason: "llm_unconfigured",
    };
  }

  try {
    const label = (
      await client.chatComplete(
        [
          {
            role: "system",
            content:
              "Write one concise, user-facing sentence explaining why a decision summary was refreshed. Do not expose internal trigger names or enum values.",
          },
          {
            role: "user",
            content: JSON.stringify({
              trigger: input.trigger,
              contextSummary: input.contextSummary,
            }),
          },
        ],
        { timeoutMs: opts.timeoutMs ?? 8_000 },
      )
    ).trim();
    if (!label || label === input.trigger || label.includes("_")) {
      return {
        label: templateLabel,
        ok: false,
        degraded: true,
        degradedReason: "llm_empty_or_internal_response",
      };
    }
    return { label, ok: true, degraded: false };
  } catch (error) {
    return {
      label: templateLabel,
      ok: false,
      degraded: true,
      degradedReason: error instanceof Error ? error.message : "llm_error",
    };
  }
}
