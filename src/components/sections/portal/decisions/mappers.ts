import type {
  AiState,
  AiStateDto,
  ChangeTrigger,
  DecisionBriefDto,
  DecisionDetailDto,
  DecisionDto,
  DecisionEntryDto,
  DecisionKind,
  DecisionLifecycle,
  DecisionOutcome,
  DecisionSnapshotDto,
  DecisionType,
  HealthContextCategory,
  HealthContextDto,
  SynthesisProvenance,
  SynthesisShape,
  TopicSlug,
  WmnResponse,
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

// ===== Home 三态（§1/§10，由 WMN 信封计数推导） =====

/** Home 三态（§1/§10）：new=全新用户 / actionable=有事要办 / empty=老用户空状态 */
export type HomeState = "new" | "actionable" | "empty";

/**
 * 由 WMN 信封计数推导 Home 三态（§10）：
 * - total===0 → new（全新用户）
 * - actionableCount>0 或 checkInDueCount>0 → actionable（优先 WMN）
 * - 否则 → empty（老用户空状态；绝不当作全新用户）
 */
export function deriveHomeState(
  w: Pick<WmnResponse, "total" | "actionableCount" | "checkInDueCount">,
): HomeState {
  if (w.total === 0) return "new";
  if (w.actionableCount > 0 || w.checkInDueCount > 0) return "actionable";
  return "empty";
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

// ===== Decide 环节（task-41）=====
// F2：人话澄清问题（用户不见 "Type A/B" 字面）
export const KIND_QUESTION = "What are you trying to decide?";

export const KIND_OPTIONS: { kind: DecisionKind; label: string }[] = [
  { kind: "action", label: "Whether to do something" },
  { kind: "exploration", label: "What to understand or do next" },
];

/** Type A outcome 人话 label */
export const OUTCOME_A_LABELS: Record<
  Extract<
    DecisionOutcome,
    | "still_considering"
    | "decided_to_do_it"
    | "decided_not_to"
    | "talk_with_clinician_first"
  >,
  string
> = {
  still_considering: "Still considering",
  decided_to_do_it: "Decided to do it",
  decided_not_to: "Decided not to",
  talk_with_clinician_first: "Talk with clinician first",
};

/** Type B outcome 人话 label */
export const OUTCOME_B_LABELS: Record<
  Extract<
    DecisionOutcome,
    | "keep_exploring"
    | "discuss_with_clinician"
    | "come_back_later"
    | "decided_on_next_step"
  >,
  string
> = {
  keep_exploring: "Keep exploring",
  discuss_with_clinician: "Discuss with clinician",
  come_back_later: "Come back later",
  decided_on_next_step: "Decided on next step",
};

/** outcome → 人话 label（不分 kind；未知原样返回） */
export function outcomeToLabel(o: DecisionOutcome): string {
  return (
    (OUTCOME_A_LABELS as Record<string, string>)[o] ??
    (OUTCOME_B_LABELS as Record<string, string>)[o] ??
    o
  );
}

/**
 * F4 归档 entry timeline 重渲染（zh/en parity：从 synthesis 结构化重建，不读 text）。
 * 返回 [前缀 badge 文本, 主体文本]。
 */
export function archivedEntryLabel(synthesis: DecisionEntryDto["synthesis"]): {
  prefix: string;
  body: string;
} {
  const outcome = synthesis?.outcome ?? null;
  const nextStep = synthesis?.nextStep ?? null;
  const o = outcome ? outcomeToLabel(outcome as DecisionOutcome) : "Undecided";
  return {
    prefix: "Closed",
    body: nextStep ? `${o} — ${nextStep}` : o,
  };
}

/** 给定 decisionKind → 对应 outcome 集合（UI 渲染 chips；unconfirmed 返回空数组） */
export function outcomesForKind(
  kind: DecisionKind,
): readonly DecisionOutcome[] {
  if (kind === "action") {
    return [
      "still_considering",
      "decided_to_do_it",
      "decided_not_to",
      "talk_with_clinician_first",
    ];
  }
  if (kind === "exploration") {
    return [
      "keep_exploring",
      "discuss_with_clinician",
      "come_back_later",
      "decided_on_next_step",
    ];
  }
  return [];
}

// =============================================================================
// task-43 综合结果层 mappers（Contract §15–§26）
// =============================================================================

/** §19 5 类的有序列表（问卷渲染顺序；镜像 enums HEALTH_CONTEXT_CATEGORIES） */
export const HEALTH_CONTEXT_CATEGORIES: readonly HealthContextCategory[] = [
  "symptoms",
  "medications_treatments",
  "related_health_changes",
  "current_health_state",
  "goals_concerns",
];

/** §19 5 类 → i18n label key（问卷文本域标题） */
export const HEALTH_CONTEXT_CATEGORY_LABEL_KEYS: Record<
  HealthContextCategory,
  string
> = {
  symptoms: "decisions.healthContext.categories.symptoms",
  medications_treatments:
    "decisions.healthContext.categories.medications_treatments",
  related_health_changes:
    "decisions.healthContext.categories.related_health_changes",
  current_health_state:
    "decisions.healthContext.categories.current_health_state",
  goals_concerns: "decisions.healthContext.categories.goals_concerns",
};

/** AI 三视角（§24 per-perspective） */
export type Perspective = "yourself" | "others" | "science";

/** 三视角有序列表（UI 渲染顺序） */
export const PERSPECTIVES: readonly Perspective[] = [
  "yourself",
  "others",
  "science",
];

/**
 * §23 ChangeTrigger → i18n key（不露原始 trigger 值）。
 * 前端 `t(key)` 后得到人话原因（D1 LLM 失败时降级文案由 i18n 兜底）。
 */
export function triggerToHumanLabelKey(trigger: ChangeTrigger): string {
  return `decisions.snapshot.trigger.${trigger}`;
}

/**
 * §24–§26 AI 五态视图（per-视角）。
 *
 * - LOADING → aiState.loading（骨架屏）
 * - READY → aiState.ready
 * - INSUFFICIENT_INFORMATION → 三视角文案 aiState.insufficient.<perspective>（§25）
 * - FAILED → aiState.failed + retryable=true（§26 Retry，绝不伪装成"无证据"）
 * - STALE_UPDATE_AVAILABLE → aiState.stale + pendingUntil 透传（D6 合并窗口）
 */
export interface AiStateView {
  state: AiState;
  messageKey: string;
  /** STALE 时透传窗口到期时间（ISO） */
  pendingUntil?: string;
  /** FAILED 时 true（前端显示 Retry） */
  retryable?: boolean;
}

/** 由 (state, perspective) 派生 AiStateView（pendingUntil 仅 STALE 时透传） */
export function aiStateToView(
  state: AiState,
  perspective: Perspective,
  opts: { pendingUntil?: string | null } = {},
): AiStateView {
  switch (state) {
    case "LOADING":
      return { state, messageKey: "aiState.loading" };
    case "READY":
      return { state, messageKey: "aiState.ready" };
    case "INSUFFICIENT_INFORMATION":
      return { state, messageKey: `aiState.insufficient.${perspective}` };
    case "FAILED":
      return { state, messageKey: "aiState.failed", retryable: true };
    case "STALE_UPDATE_AVAILABLE":
      return {
        state,
        messageKey: "aiState.stale",
        pendingUntil: opts.pendingUntil ?? undefined,
      };
  }
}

/** 把 server AiStateDto 转成三视角 AiStateView（前端渲染用） */
export function mapAiStateDto(dto: AiStateDto): {
  yourself: AiStateView;
  others: AiStateView;
  science: AiStateView;
} {
  const pendingUntil = dto.pendingUntil ?? null;
  return {
    yourself: aiStateToView(dto.yourself, "yourself", { pendingUntil }),
    others: aiStateToView(dto.others, "others", { pendingUntil }),
    science: aiStateToView(dto.science, "science", { pendingUntil }),
  };
}

/**
 * R6 透明化：provenance=template+llm_trigger_degraded 表示 LLM 调用失败降级模板。
 * 前端 AiState 仍标 READY（不伪装 FAILED），但小字标注可见 degraded。
 */
export function isDegradedProvenance(p: SynthesisProvenance): boolean {
  return p === "template+llm_trigger_degraded";
}

/**
 * §19 Health Context 5 类 → 问卷渲染行（预填 + 编辑）。
 * 缺失类按空字符串填入（用户从零填；§19 "已有答案预填" 兼容首次进入）。
 * 非字符串值转 string（defensive，服务端 JSON 字段可能混入对象）。
 */
export interface HealthContextCategoryRow {
  category: HealthContextCategory;
  labelKey: string;
  value: string;
}

export function mapHealthContextToCategories(
  dto: HealthContextDto | null | undefined,
): HealthContextCategoryRow[] {
  const ctx = dto?.healthContext ?? null;
  return HEALTH_CONTEXT_CATEGORIES.map((category) => {
    const raw = ctx?.[category];
    const value =
      raw == null ? "" : typeof raw === "string" ? raw : String(raw);
    return {
      category,
      labelKey: HEALTH_CONTEXT_CATEGORY_LABEL_KEYS[category],
      value,
    };
  });
}

/**
 * Snapshot → 视图：合成文本四元组 + trigger 人话 key + provenance degraded 标志。
 * HistorySnapshotList 与 CurrentSynthesisPanel 共用此映射。
 */
export interface SnapshotView {
  id: string;
  createdAt: string;
  changeTrigger: ChangeTrigger;
  triggerLabelKey: string;
  /** 服务端 LLM 生成的人话原因；前端优先用此值，缺失时回退 i18n triggerLabelKey */
  triggerHumanLabel?: string;
  synthesis: SynthesisShape | null;
  provenance: SynthesisProvenance;
  degraded: boolean;
}

export function mapSnapshotToView(snap: DecisionSnapshotDto): SnapshotView {
  return {
    id: snap.id,
    createdAt: snap.createdAt,
    changeTrigger: snap.changeTrigger,
    triggerLabelKey: triggerToHumanLabelKey(snap.changeTrigger),
    triggerHumanLabel: snap.triggerHumanLabel,
    synthesis: snap.synthesis,
    provenance: snap.provenance,
    degraded: isDegradedProvenance(snap.provenance),
  };
}

/** 按 createdAt DESC 排序历史 Snapshot（History 视图，§15 倒序） */
export function sortSnapshotsDesc(
  snaps: DecisionSnapshotDto[],
): DecisionSnapshotDto[] {
  return [...snaps].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
