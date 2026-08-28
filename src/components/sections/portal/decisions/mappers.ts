import type {
  DecisionBriefDto,
  DecisionDetailDto,
  DecisionDto,
  DecisionEntryDto,
  DecisionLifecycle,
  DecisionType,
  TopicSlug,
} from "./dto";

/** lifecycle → badge label（Contract §5 6 值） */
const LIFECYCLE_TO_LABEL: Record<DecisionLifecycle, string> = {
  ACTIVE: "Active",
  DECIDED: "Decided",
  OBSERVING: "Observing",
  LEARNING: "Learning",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

/** lifecycle → badge label */
export function lifecycleToLabel(l: DecisionLifecycle): string {
  return LIFECYCLE_TO_LABEL[l];
}

/** Actionable = lifecycle ∉ {CLOSED, COMPLETED}（§6） */
export function isActionable(l: DecisionLifecycle): boolean {
  return l !== "CLOSED" && l !== "COMPLETED";
}

/** 列表 DTO → { actionable, history } 两组 */
export interface DecisionGroups {
  actionable: DecisionDto[];
  history: DecisionDto[]; // lifecycle ∈ {CLOSED, COMPLETED}
}

/** 按 lifecycle 分 Actionable / History（保留原顺序） */
export function groupDecisions(items: DecisionDto[]): DecisionGroups {
  const actionable: DecisionDto[] = [];
  const history: DecisionDto[] = [];
  for (const d of items) {
    if (isActionable(d.lifecycle)) actionable.push(d);
    else history.push(d);
  }
  return { actionable, history };
}

/** Brief DTO → BriefView（hasXxx flags for 条件渲染） */
export interface BriefView {
  hasYourHistory: boolean;
  hasSimilarJourneys: boolean;
  hasEvidence: boolean;
  hasQuestions: boolean;
  yourHistory: string[];
  similarJourneysSummary: string;
  similarJourneysNote: string;
  evidenceKnown: string[];
  evidenceUncertain: string[];
  questionsForClinician: string[];
}

/** Brief 可能 null/undefined（task-10 注明 P2 前为快照/占位）。null → null（整块隐藏） */
export function mapBrief(
  brief: DecisionBriefDto | undefined | null,
): BriefView | null {
  if (brief == null) return null;
  return {
    hasYourHistory: brief.yourHistory.length > 0,
    hasSimilarJourneys:
      brief.similarJourneys.summary.trim().length > 0 ||
      brief.similarJourneys.note.trim().length > 0,
    hasEvidence:
      brief.evidence.known.length > 0 || brief.evidence.uncertain.length > 0,
    hasQuestions: brief.questionsForClinician.length > 0,
    yourHistory: brief.yourHistory,
    similarJourneysSummary: brief.similarJourneys.summary,
    similarJourneysNote: brief.similarJourneys.note,
    evidenceKnown: brief.evidence.known,
    evidenceUncertain: brief.evidence.uncertain,
    questionsForClinician: brief.questionsForClinician,
  };
}

/** entries 按 occurredAt 升序排序（旧→新，时间线从上到下） */
export function sortEntries(entries: DecisionEntryDto[]): DecisionEntryDto[] {
  return [...entries].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

/** 详情 DTO → 完整视图对象（已 sort entries + mapBrief） */
export interface DecisionDetailView {
  id: string;
  question: string;
  goal: string | null;
  lifecycle: DecisionLifecycle;
  lifecycleLabel: string;
  updated: string;
  brief: BriefView | null;
  entries: DecisionEntryDto[]; // 已排序
}

export function mapDecisionDetail(
  detail: DecisionDetailDto,
): DecisionDetailView {
  return {
    id: detail.id,
    question: detail.question,
    goal: detail.goal,
    lifecycle: detail.lifecycle,
    lifecycleLabel: lifecycleToLabel(detail.lifecycle),
    updated: detail.updated,
    brief: mapBrief(detail.brief),
    entries: sortEntries(detail.entries),
  };
}

/** topic chip 三元组：一个 Home chip 预填 { topic, topicSlug, type } */
export interface TopicChip {
  topic: string;
  topicSlug: TopicSlug;
  type: DecisionType;
}

/** chip label → topic 三元组（Home "Ask about your health" chips；chip 语义=选 topic） */
const CHIP_TO_TOPIC: Record<string, TopicChip> = {
  Thermage: { topic: "Thermage", topicSlug: "thermage", type: "procedure" },
  Ultherapy: { topic: "Ultherapy", topicSlug: "ultherapy", type: "procedure" },
  Botox: { topic: "Botox", topicSlug: "botox", type: "procedure" },
  Laser: { topic: "Laser", topicSlug: "laser", type: "procedure" },
  Filler: { topic: "Filler", topicSlug: "filler", type: "procedure" },
  HRT: { topic: "HRT", topicSlug: "hrt", type: "medication" },
  "A skincare product": {
    topic: "Skincare",
    topicSlug: "skincare",
    type: "product",
  },
  "A doctor or clinic": {
    topic: "Clinic",
    topicSlug: "clinic",
    type: "not_sure",
  },
};

/** chips 列表（与 portal/page.tsx 保持一致；chip 语义 = 选 topic） */
export const DECISION_CHIPS = Object.keys(CHIP_TO_TOPIC);

/** chip label → topic 三元组（未知 chip → undefined） */
export function chipToTopic(chip: string): TopicChip | undefined {
  return CHIP_TO_TOPIC[chip];
}

/** 粗粒度 type → 展示 label（详情页 type 切换 chips 用） */
const TYPE_TO_LABEL: Record<DecisionType, string> = {
  procedure: "Procedure",
  medication: "Medication",
  treatment: "Treatment",
  test: "Test",
  supplement: "Supplement",
  lifestyle: "Lifestyle",
  product: "Product",
  not_sure: "Not sure yet",
};

export const ALL_DECISION_TYPES = Object.keys(TYPE_TO_LABEL) as DecisionType[];

/** 粗粒度 type → 展示 label */
export function typeToLabel(t: DecisionType): string {
  return TYPE_TO_LABEL[t];
}

/** topicSlug → 展示 label（详情/展示用） */
const TOPIC_SLUG_TO_LABEL: Record<TopicSlug, string> = {
  thermage: "Thermage",
  ultherapy: "Ultherapy",
  botox: "Botox",
  laser: "Laser",
  filler: "Filler",
  hrt: "HRT",
  skincare: "Skincare",
  clinic: "Clinic",
};

/** topicSlug → 展示 label */
export function topicSlugToLabel(s: TopicSlug): string {
  return TOPIC_SLUG_TO_LABEL[s];
}

/** chip label → 预填 question 模板："Should I do <chip label>?" */
export function chipToQuestionTemplate(chip: string): string {
  return `Should I do ${chip}?`;
}

// ===== Goal（Spine 起点：每个 Decision 绑定一个 Goal） =====

/** goal → 展示 label（词汇对齐 user_baseline.concern_goals） */
const GOAL_TO_LABEL: Record<string, string> = {
  firmness: "Firmer skin",
  "even-tone": "Even skin tone",
  acne: "Clearer skin",
  "sleep-quality": "Better sleep",
  energy: "More energy",
  mood: "Balanced mood",
  "hot-flashes": "Fewer hot flashes",
};

/** 新建决策时可选的预设 goal chips */
export const GOAL_OPTIONS = Object.keys(GOAL_TO_LABEL);

/** goal key → label；自定义 goal 原样返回（首字母大写） */
export function goalToLabel(goal: string): string {
  const known = GOAL_TO_LABEL[goal];
  if (known) return known;
  return goal.charAt(0).toUpperCase() + goal.slice(1);
}

// ===== Spine flow 文本构造（供 flows/SaveAsDecisionButton 使用） =====
// 映射定义见 a_docs/drruby-docs/product-spine.md：
//   skin flow = CONSIDER+DECIDE(skin)，stack flow = CONSIDER+DECIDE(supplement)，feel flow = OBSERVE+LEARN

/** flow 来源（写入决策首条 entry 的来源标注） */
export type FlowSource =
  | "skin-analysis"
  | "supplement-evaluation"
  | "feel-check-in";

const FLOW_SOURCE_TO_LABEL: Record<FlowSource, string> = {
  "skin-analysis": "Skin analysis",
  "supplement-evaluation": "Supplement evaluation",
  "feel-check-in": "Feel check-in",
};

/** skin flow chips → question: "Skin: dryness, redness"（chip labels join with comma） */
export function skinConsiderToQuestion(symptomLabels: string[]): string {
  return `Skin: ${symptomLabels.join(", ")}`;
}

/** stack flow supplement + duration → question: "Magnesium · 4-8w" */
export function stackConsiderToQuestion(
  supplementLabel: string,
  durationLabel: string,
): string {
  return `${supplementLabel} · ${durationLabel}`;
}

/** feel flow 静态文案 → question */
export function feelObserveToQuestion(): string {
  return "How I've been feeling";
}

/** 构造首条 entry 的 text："Created from <flow 来源> · <chips>" */
export function buildEntryText(
  source: FlowSource,
  chipsSummary: string,
): string {
  return `Created from ${FLOW_SOURCE_TO_LABEL[source]} · ${chipsSummary}`;
}
