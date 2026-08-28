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

/** 三源 Decision Brief 快照（对齐 server DecisionBriefDTO） */
export interface DecisionBriefDto {
  yourHistory: string[];
  similarJourneys: { summary: string; note: string };
  evidence: { known: string[]; uncertain: string[] };
  questionsForClinician: string[];
}

/** append-only 时间线条目（详情附带） */
export interface DecisionEntryDto {
  id: string;
  text: string;
  lifecycleSnapshot: DecisionLifecycle;
  occurredAt: string; // ISO
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
  brief?: DecisionBriefDto; // 列表省 brief；详情含 brief
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
