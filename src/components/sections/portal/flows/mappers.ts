import {
  buildEntryText,
  feelObserveToQuestion,
  skinConsiderToQuestion,
  stackConsiderToQuestion,
} from "@/components/sections/portal/decisions/mappers";

/**
 * Spine flow 的"保存为决策"文本构造：薄 re-export 自 decisions/mappers，
 * 让 SaveAsDecisionButton 只 import 一个本模块入口，不直接依赖 decisions/。
 * 映射定义见 a_docs/drruby-docs/product-spine.md。
 */
export {
  buildEntryText,
  feelObserveToQuestion,
  skinConsiderToQuestion,
  stackConsiderToQuestion,
};

/** skin flow 的 chips summary：直接 join labels（保留"All of the above"原样） */
export function skinChipsSummary(labels: string[]): string {
  return labels.join(", ");
}

/** stack flow 的 chips summary：supplement + duration 拼接（同 question 格式） */
export function stackChipsSummary(
  supplementLabel: string,
  durationLabel: string,
): string {
  return `${supplementLabel} · ${durationLabel}`;
}

/** feel flow 没有 chips，summary 直接用静态文案 */
export function feelChipsSummary(): string {
  return feelObserveToQuestion();
}
