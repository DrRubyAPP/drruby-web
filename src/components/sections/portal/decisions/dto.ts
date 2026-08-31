/**
 * 镜像 /api/decisions/dto.ts 的 5 个 DTO。
 * 不复用 server 端文件（避免拉入 prisma 依赖），独立声明同构 interface。
 */

/** decision.lifecycle — Contract §5 生命周期 6 值（默认 ACTIVE） */
export type DecisionLifecycle =
  | "ACTIVE"
  | "DECIDED"
  | "OBSERVING"
  | "LEARNING"
  | "COMPLETED"
  | "CLOSED";

/** decision.decisionKind — Contract §3 Type A/B（用户永不见字面；默认 unconfirmed） */
export type DecisionKind = "action" | "exploration" | "unconfirmed";

/** decision.outcome — 按 kind 分组的 8 值，可空=未决 */
export type DecisionOutcome =
  | "still_considering"
  | "decided_to_do_it"
  | "decided_not_to"
  | "talk_with_clinician_first"
  | "keep_exploring"
  | "discuss_with_clinician"
  | "come_back_later"
  | "decided_on_next_step";

/** decision.type — 粗粒度 8 值（对齐 enums decisionTypeSchema），可空 */
export type DecisionType =
  | "procedure"
  | "medication"
  | "treatment"
  | "test"
  | "supplement"
  | "lifestyle"
  | "product"
  | "not_sure";

/** topic 归一化 slug（对齐 enums topicSlugSchema），可空 */
export type TopicSlug =
  | "thermage"
  | "ultherapy"
  | "botox"
  | "laser"
  | "filler"
  | "hrt"
  | "skincare"
  | "clinic";

// =============================================================================
// task-43 综合结果层枚举（镜像 src/lib/db/enums.ts，避免拉入 prisma 依赖）
// =============================================================================

/** decision_snapshot.change_trigger — §23 五触发因 + initial sentinel */
export type ChangeTrigger =
  | "new_record"
  | "health_context_update"
  | "others_refresh"
  | "science_refresh"
  | "observation_update"
  | "initial";

/** decision_snapshot.synthesis_provenance — D1 模板为主 + 小处 LLM */
export type SynthesisProvenance =
  | "template"
  | "template+llm_trigger"
  | "template+llm_trigger_degraded"
  | "initial";

/** decision.health_context_status — §20 永不自动从 unconfirmed 转 confirmed */
export type HealthContextStatus = "confirmed" | "unconfirmed";

/** decision.health_context 5 类（§19 Yourself 结构化组成） */
export type HealthContextCategory =
  | "symptoms"
  | "medications_treatments"
  | "related_health_changes"
  | "current_health_state"
  | "goals_concerns";

/** §24–§26 AI 状态机五态（per-视角；rule-based，不依赖 LLM） */
export type AiState =
  | "LOADING"
  | "READY"
  | "INSUFFICIENT_INFORMATION"
  | "FAILED"
  | "STALE_UPDATE_AVAILABLE";

/** 三源 Decision Brief 快照（对齐 server DecisionBriefDTO） */
export interface DecisionBriefDto {
  yourHistory: string[];
  similarJourneys: { summary: string; note: string };
  evidence: { known: string[]; uncertain: string[] };
  questionsForClinician: string[];
}

/** observation direction（§28 better/same/worse/not_sure，非必填） */
export type ObservationDirection = "better" | "same" | "worse" | "not_sure";

/** §27 Start Observing 时存的 baseline 结构（决策级，Stop/Learn 时归档到 learning entry synthesis） */
export interface ObserveBaselineDto {
  text: string;
  baselineRecordId?: string | null;
  freq: "daily" | "3days" | "weekly" | "2weeks" | "monthly";
}

/** check-in 频率（D6 固定 5 值） */
export type CheckInFrequency = ObserveBaselineDto["freq"];

/** append-only 时间线条目（详情附带） */
export interface DecisionEntryDto {
  id: string;
  text: string;
  lifecycleSnapshot: DecisionLifecycle;
  occurredAt: string; // ISO
  /** §6 归档 entry 标记（如 "archived_outcome"）；普通 entry 为 null */
  kind?: string | null;
  /** task-44 §28 observation 方向（better/same/worse/not_sure，非必填；kind=observation 时存在） */
  direction?: ObservationDirection | null;
  /** D3 归档结构化数据（kind="archived_outcome" 时含原 outcome/nextStep/brief；
   *  kind="observation" 时承载 {photos, recordRefs}；
   *  kind="learning" 时承载 {text, supportingObservationIds, generatedAt}） */
  synthesis?: {
    outcome?: string | null;
    nextStep?: string | null;
    brief?: DecisionBriefDto;
    // task-44 kind=observation 附件
    photos?: { recordId: string; summary?: string }[];
    recordRefs?: { recordId: string; summary?: string }[];
    // task-44 kind=learning 附件
    text?: string;
    supportingObservationIds?: string[];
    generatedAt?: string;
  } | null;
}

/** 列表项 / 单个决策（省 brief） */
export interface DecisionDto {
  id: string;
  question: string;
  /** 该决策服务的目标（对齐 concern_goals 词汇；旧数据可空） */
  goal: string | null;
  /** 粗粒度决策种类（只影响 Science 措辞框架） */
  type: DecisionType | null;
  /** 决策针对的实体/主题（自由文本，展示用） */
  topic: string | null;
  /** topic 归一化 slug（驱动语料检索） */
  topicSlug: TopicSlug | null;
  /** Contract §5 生命周期（默认 ACTIVE） */
  lifecycle: DecisionLifecycle;
  /** Contract §3 Type A/B（用户永不见字面） */
  decisionKind: DecisionKind | null;
  /** 按 kind 分组的 outcome（可空=未决） */
  outcome: DecisionOutcome | null;
  /** Type B decided_on_next_step 必带 */
  nextStep: string | null;
  /** Keep this 落库后 true（§11：saved = 纯书签，不影响可见性） */
  saved: boolean;
  /** Yourself 视角轻量背景（随 Keep this 一并落库，F3/B8） */
  yourselfContext: string | null;
  updated: string; // ISO
  /** §8 What Matters Now 排序键 */
  lastUserActivityAt: string; // ISO
  /** §6 freshness gate 时间戳；Reopen 后为 null，Check now 后置 now（服务端派生） */
  freshnessCheckedAt?: string | null;
  /** 决策定下时间（outcome→DECIDED/CLOSED 时派生；outcome→ACTIVE 或 null 时清空） */
  decidedAt?: string | null;
  brief?: DecisionBriefDto; // 列表省 brief；详情含 brief
  // task-43 综合结果层（全可选 nullable，R1/R11 兼容）
  /** Decision 当前 Current Snapshot id（首次打开时 orchestrator 触发建首版，R1） */
  currentSnapshotId?: string | null;
  /** §19/D5 结构化 5 类（healthContextCategory 键 → 字符串值；部分类可缺失） */
  healthContext?: Partial<Record<HealthContextCategory, string>> | null;
  /** §20 confirmed | unconfirmed（永不自动转 confirmed） */
  healthContextStatus?: HealthContextStatus | null;
  /** DECIDE 前 gate 确认时间戳（status=confirmed 时派生） */
  healthContextConfirmedAt?: string | null;
  /** §18/D6 合并窗口到期时间戳；非空 → STALE_UPDATE_AVAILABLE */
  pendingRegenAt?: string | null;
  // task-44 Observe / Learn（§27/§30）
  /** §30 到期 check-in 时间戳（OBSERVING 状态下由 freq 顺延；Stop/Learn 时清空） */
  nextCheckInAt?: string | null;
  /** §27 Start Observing 时存的 baseline（{text, baselineRecordId?, freq}） */
  observeBaseline?: ObserveBaselineDto | null;
}

// =============================================================================
// task-43 综合结果层 DTO（镜像 /api/decisions/dto.ts）
// =============================================================================

/** SynthesisResult.synthesis 文本四元组（D1 模板重组输出） */
export interface SynthesisShape {
  yourself: string;
  others: string;
  science: string;
  combined: string;
}

/** §15/§23 综合 Snapshot（Current/History 共用此 DTO；镜像 server DecisionSnapshotDTO） */
export interface DecisionSnapshotDto {
  id: string;
  decisionId: string;
  /** 快照时的 Record 引用 + 摘要（R3：保证历史可还原，Record 软删后不悬空） */
  yourselfContextRef: unknown | null;
  /** SourceRef[] 引用集（Record id + Others/Science 语料段 id） */
  sources: unknown | null;
  /** CitationRef[] 引用集 */
  citations: unknown | null;
  /** D1 模板重组四元组文本；首次建首版前为 null */
  synthesis: SynthesisShape | null;
  provenance: SynthesisProvenance;
  changeTrigger: ChangeTrigger;
  createdAt: string; // ISO
  /** §23 人话原因（不露原始 trigger 值；LLM 生成，失败降级模板） */
  triggerHumanLabel?: string;
}

/** §19/§20 Health Context（GET 返回预填、PUT 写入；镜像 server HealthContextDTO） */
export interface HealthContextDto {
  /** §19/D5 5 类结构化 health context（部分类可缺失） */
  healthContext: Partial<Record<HealthContextCategory, string>> | null;
  status: HealthContextStatus | null;
  /** status=confirmed 时存在；ISO */
  healthContextConfirmedAt?: string | null;
}

/** §24–§26 AI 状态机五态（per-视角；镜像 server AiStateDTO） */
export interface AiStateDto {
  yourself: AiState;
  others: AiState;
  science: AiState;
  /** STALE 时返回 pendingUntil（窗口到期时间）；其他状态 null */
  pendingUntil?: string | null;
}

/** GET /api/decisions/[id]/snapshots 信封（Current + History） */
export interface SnapshotsResponseDto {
  current: DecisionSnapshotDto | null;
  history: DecisionSnapshotDto[];
}

/** POST /api/decisions/[id]/regenerate 响应 */
export interface RegenerateResponseDto {
  material: boolean;
  snapshotId?: string;
  reason?: string;
}

/** POST /api/decisions/[id]/regenerate 入参 */
export interface RegenerateInput {
  trigger?: ChangeTrigger;
  corpusVersionChanged?: boolean;
}

/** PUT /api/decisions/[id]/health-context 入参 */
export interface UpdateHealthContextInput {
  healthContext?: Partial<Record<HealthContextCategory, string>> | null;
  status?: HealthContextStatus;
}

/** 详情：Decision + entries */
export interface DecisionDetailDto extends DecisionDto {
  entries: DecisionEntryDto[];
}

/** POST /api/decisions 入参（goal 可选，对齐 server CreateDecisionBody；幂等走服务端 60s 去重，不传 requestId） */
export interface CreateDecisionInput {
  question: string;
  goal?: string;
  type?: DecisionType | null; // 缺省 not_sure（粗粒度）
  /** 决策针对的实体/主题（自由文本；chip 预填，自由 Ask 省略 → null） */
  topic?: string;
  /** topic 归一化 slug（chip 预填；驱动语料检索） */
  topicSlug?: TopicSlug;
}

/** POST /api/decisions/[id] 入参（PATCH 语义，lifecycle 三维 + Save） */
export interface UpdateDecisionInput {
  question?: string;
  type?: DecisionType | null;
  topic?: string;
  topicSlug?: TopicSlug;
  lifecycle?: DecisionLifecycle;
  decisionKind?: DecisionKind;
  outcome?: DecisionOutcome | null;
  nextStep?: string | null;
  /** Keep this：saved + yourselfContext 一次提交（§11 纯书签） */
  saved?: boolean;
  yourselfContext?: string;
}

/** POST /api/decisions/[id]/entries 入参（append-only；lifecycle 快照由服务端沿用，前端不传） */
export interface AppendEntryInput {
  text: string;
  occurredAt?: string; // ISO，缺省 now
}

// =============================================================================
// task-44 Observe / Learn 输入（§27/§28/§29）
// =============================================================================

/** POST /api/decisions/[id]/observe/start 入参 */
export interface StartObservingInput {
  baselineText: string;
  baselineRecordId?: string;
  freq: CheckInFrequency;
}

/** POST /api/decisions/[id]/observations 入参（§28 新建 Observation） */
export interface CreateObservationEntryInput {
  text: string;
  /** direction 非必填（§28 允许无方向描述） */
  direction?: ObservationDirection;
  /** synthesis {photos, recordRefs} 可选 */
  synthesis?: {
    photos?: { recordId: string; summary?: string }[];
    recordRefs?: { recordId: string; summary?: string }[];
  };
  occurredAt?: string; // ISO
}

/** PATCH /api/decisions/[id]/observations/[entryId] 入参（D8 修正 Observation） */
export interface UpdateObservationEntryInput {
  text?: string;
  /** direction 非必填，可显式 null 清空 */
  direction?: ObservationDirection | null;
  synthesis?: {
    photos?: { recordId: string; summary?: string }[];
    recordRefs?: { recordId: string; summary?: string }[];
  };
}

/** POST /api/decisions/[id]/learn 入参（§29 保存 Learning summary） */
export interface SaveLearningInput {
  text: string;
  supportingObservationIds: string[];
}

/** GET /api/decisions/[id]/learn 返回的模板预填 */
export interface LearningTemplateDto {
  text: string;
  supportingObservationIds: string[];
}

/** POST /api/decisions/[id]/observe/stop 返回（决定下一步是 LEARNING 还是 COMPLETED） */
export interface StopObservingResponse {
  lifecycle: "LEARNING" | "COMPLETED";
  hasObservations: boolean;
}

/** GET /api/decisions/wmn 信封（对齐 server WmnResponse；前端只消费不重排） */
export interface WmnResponse {
  /** ≤3 张，服务端已 P1/P2/P3 排序、去重 */
  cards: DecisionDto[];
  /** 全部 Decision 数（含 CLOSED/COMPLETED），驱动 Home 三态 */
  total: number;
  /** isActionable 计数 */
  actionableCount: number;
  /** P1 check-in due 计数（task-44 前恒 0） */
  checkInDueCount: number;
}
