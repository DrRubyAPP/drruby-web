/**
 * task-43 D1 LLM 触发文案助手（Contract §23 + B6）
 *
 * 仅用于 trigger 人话文案 + 不确定性提示（synthesis 主体由模板重组）。
 * 失败降级到模板字典（provenance 标 *_degraded）；不伪装成"无证据"。
 *
 * V1 实现：
 * - 环境变量 `LLM_TRIGGER_API_KEY` 缺失 → 自动降级（不算 LLM 调用，degraded=true）
 * - 调用 fetch 失败 / 非 200 → 降级模板（degraded=true）
 * - initial trigger → 不调 LLM，模板字典（degraded=false）
 *
 * 真实 LLM 选型延后（O3）；接口契约固定，task-43+ 仅替换实现。
 */
import type { ChangeTrigger } from "@/lib/db/enums";

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
 * 2. LLM_TRIGGER_API_KEY 缺失 → 模板字典，degraded=true
 * 3. fetch LLM 成功 → label=LLM 输出，ok=true，degraded=false
 * 4. fetch 失败 / 非 200 → 模板字典，degraded=true
 */
export async function generateTriggerLabel(
  input: TriggerLabelInput,
): Promise<TriggerLabelResult> {
  const templateLabel = TRIGGER_TEMPLATES[input.trigger] ?? GENERIC_FALLBACK;

  // initial 不调 LLM
  if (input.trigger === "initial") {
    return { label: templateLabel, ok: false, degraded: false };
  }

  const apiKey = process.env.LLM_TRIGGER_API_KEY;
  if (!apiKey) {
    return { label: templateLabel, ok: false, degraded: true };
  }

  try {
    const res = await fetch("https://api.placeholder.example/v1/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        trigger: input.trigger,
        contextSummary: input.contextSummary,
      }),
    });
    if (!res.ok) {
      return { label: templateLabel, ok: false, degraded: true };
    }
    const data = (await res.json()) as { label?: string };
    if (!data.label || typeof data.label !== "string") {
      return { label: templateLabel, ok: false, degraded: true };
    }
    return { label: data.label, ok: true, degraded: false };
  } catch {
    return { label: templateLabel, ok: false, degraded: true };
  }
}
