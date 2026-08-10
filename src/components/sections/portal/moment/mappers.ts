import {
  buildEntryText,
  moment1ToQuestion,
  moment2ToQuestion,
  moment3ToQuestion,
} from "@/components/sections/portal/decisions/mappers";

/**
 * moment 流程的"保存为决策"文本构造：薄 re-export 自 decisions/mappers，
 * 让 SaveAsDecisionButton 只 import 一个本模块入口，不直接依赖 decisions/。
 */
export {
  buildEntryText,
  moment1ToQuestion,
  moment2ToQuestion,
  moment3ToQuestion,
};

/** Moment 1 的 chips summary：直接 join labels（保留"All of the above"原样） */
export function moment1ChipsSummary(labels: string[]): string {
  return labels.join(", ");
}

/** Moment 2 的 chips summary：supplement + duration 拼接（同 question 格式） */
export function moment2ChipsSummary(
  supplementLabel: string,
  durationLabel: string,
): string {
  return `${supplementLabel} · ${durationLabel}`;
}

/** Moment 3 没有 chips，summary 直接用静态文案 */
export function moment3ChipsSummary(): string {
  return moment3ToQuestion();
}
