/**
 * task-43 综合层汇总入口（D1）
 *
 * 工厂：createSynthesizer() 返回 TemplateSynthesizer（V1 默认）。
 * 真实 LLM synthesis 整体重写延后到 V1 之后（O3），接口契约固定。
 */

export type { TriggerLabelInput, TriggerLabelResult } from "./llmTriggerHelper";
export { generateTriggerLabel } from "./llmTriggerHelper";
export { TemplateSynthesizer } from "./templateSynthesizer";
export type {
  CitationRef,
  ConnectedRecordRef,
  HealthContext,
  SourceRef,
  SynthesisInput,
  SynthesisResult,
  Synthesizer,
} from "./types";

import { TemplateSynthesizer } from "./templateSynthesizer";
import type { Synthesizer } from "./types";

/**
 * 工厂：返回 Synthesizer 实例。
 * V1 默认 TemplateSynthesizer；O3 真实 LLM 选型延后。
 */
export function createSynthesizer(): Synthesizer {
  return new TemplateSynthesizer();
}
