import type {
  DecisionBriefDto,
  DecisionDetailDto,
  DecisionDto,
  DecisionEntryDto,
  DecisionStatus,
  DecisionType,
} from "./dto";

/** status 枚举列表（用于详情抽屉的 chips 渲染） */
export const DECISION_STATUSES: DecisionStatus[] = [
  "considering",
  "in-progress",
  "decided",
  "paused",
];

/** status → badge label 直接映射（4 值，无 Did not proceed/Completed/faded） */
const STATUS_TO_LABEL: Record<DecisionStatus, string> = {
  considering: "Considering",
  "in-progress": "In progress",
  decided: "Decided",
  paused: "Paused",
};

/** status → badge label */
export function statusToLabel(status: DecisionStatus): string {
  return STATUS_TO_LABEL[status];
}

/** Active 组 = status !== 'decided'；Saved 组 = status === 'decided' */
export function isActive(status: DecisionStatus): boolean {
  return status !== "decided";
}

/** 列表 DTO → { active, saved } 两组 */
export interface DecisionGroups {
  active: DecisionDto[];
  saved: DecisionDto[]; // status === 'decided'
}

/** 把扁平列表分组为 active/saved 两组（保留原顺序） */
export function groupDecisions(items: DecisionDto[]): DecisionGroups {
  const active: DecisionDto[] = [];
  const saved: DecisionDto[] = [];
  for (const d of items) {
    if (isActive(d.status)) active.push(d);
    else saved.push(d);
  }
  return { active, saved };
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
  status: DecisionStatus;
  statusLabel: string;
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
    status: detail.status,
    statusLabel: statusToLabel(detail.status),
    updated: detail.updated,
    brief: mapBrief(detail.brief),
    entries: sortEntries(detail.entries),
  };
}

/** chip label → DecisionType 映射（用于"Start a new decision"chips） */
const CHIP_TO_TYPE: Record<string, DecisionType> = {
  Thermage: "thermage",
  Ultherapy: "ultherapy",
  Botox: "botox",
  Laser: "laser",
  Filler: "filler",
  HRT: "hrt",
  "A skincare product": "skincare",
  "A doctor or clinic": "clinic",
  "Not sure yet": "not_sure",
};

/** chips 列表（与 portal/page.tsx mock 保持一致） */
export const DECISION_CHIPS = Object.keys(CHIP_TO_TYPE);

/** chip label → type 枚举 */
export function chipToType(chip: string): DecisionType {
  return CHIP_TO_TYPE[chip];
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
export type FlowSource = "skin-analysis" | "supplement-evaluation" | "feel-check-in";

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
