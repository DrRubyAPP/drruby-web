import type { DecisionEntry } from "~prisma/client";

export interface LearningTemplateInput {
  /** kind=observation entries（按 occurredAt 升序传入） */
  observations: Pick<DecisionEntry, "id" | "direction">[];
  locale: "en" | "zh";
}

export interface LearningTemplateOutput {
  text: string;
  supportingObservationIds: string[];
}

/**
 * §29 Learning 模板拼装（D1，不引入 LLM）。
 *
 * 允许的表述：
 * - "you recorded N observations"
 * - "you recorded 'better' changes more than once"（重复方向）
 * - "this may be worth continuing to observe"
 *
 * 禁用项（§29）：
 * - 不展示 Emerging/Moderate/Strong/"83% 置信度"等模式强度标签
 * - 不展示任何数值化的模式强度评分
 *
 * 模板"引擎"是纯函数：输入 observations + locale → 输出 text + supportingObservationIds。
 * supportingObservationIds 默认全部 observation 引用（D12 用户可在 UI 取消个别）。
 */
export function buildLearningTemplate(
  input: LearningTemplateInput,
): LearningTemplateOutput {
  const { observations, locale } = input;
  const ids = observations.map((o) => o.id);

  if (observations.length === 0) {
    return {
      text:
        locale === "zh"
          ? "尚未记录观察结果。"
          : "No observations recorded yet.",
      supportingObservationIds: [],
    };
  }

  // 统计方向分布（null/undefined 归入 not_sure 桶）
  const dirCount = observations.reduce(
    (acc, o) => {
      const d = (o.direction ?? "not_sure") as
        | "better"
        | "same"
        | "worse"
        | "not_sure";
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const n = observations.length;
  const sorted = Object.entries(dirCount).sort((a, b) => b[1] - a[1]);
  const maxDir = sorted[0]; // [direction, count]

  // 出现 ≥2 次的同方向 → "more than once" 句式；否则只报总数
  const directionPhrase =
    maxDir && maxDir[1] >= 2
      ? locale === "zh"
        ? `你不止一次记录到 "${maxDir[0]}" 方向的变化（共 ${maxDir[1]} 次）。`
        : `You recorded "${maxDir[0]}" changes more than once (${maxDir[1]} times).`
      : locale === "zh"
        ? `你已记录 ${n} 次观察。`
        : `You recorded ${n} observation${n > 1 ? "s" : ""}.`;

  const continuePhrase =
    locale === "zh"
      ? "这可能值得继续观察。"
      : "This may be worth continuing to observe.";

  return {
    text: `${directionPhrase} ${continuePhrase}`,
    supportingObservationIds: ids,
  };
}
