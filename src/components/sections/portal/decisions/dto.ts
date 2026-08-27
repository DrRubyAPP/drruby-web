/**
 * 镜像 /api/decisions/dto.ts 的 5 个 DTO。
 * 不复用 server 端文件（避免拉入 prisma 依赖），独立声明同构 interface。
 */

/** decision.status — 4 值（参考 src/lib/db/enums.ts:125-132） */
export type DecisionStatus =
  | "considering"
  | "in-progress"
  | "decided"
  | "paused";

/** decision.type — 9 值（参考 src/lib/db/enums.ts:135-146），可空 */
export type DecisionType =
  | "thermage"
  | "ultherapy"
  | "botox"
  | "laser"
  | "filler"
  | "hrt"
  | "skincare"
  | "clinic"
  | "not_sure";

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
  statusSnapshot: DecisionStatus;
  occurredAt: string; // ISO
}

/** 列表项 / 单个决策（省 brief） */
export interface DecisionDto {
  id: string;
  question: string;
  /** 该决策服务的目标（对齐 concern_goals 词汇；旧数据可空） */
  goal: string | null;
  type: DecisionType | null;
  status: DecisionStatus;
  /** Keep this 落库后 true（F4：saved = 可被检索） */
  saved: boolean;
  /** Yourself 视角轻量背景（随 Keep this 一并落库，F3/B8） */
  yourselfContext: string | null;
  updated: string; // ISO
  brief?: DecisionBriefDto; // 列表省 brief；详情含 brief
}

/** 详情：Decision + entries */
export interface DecisionDetailDto extends DecisionDto {
  entries: DecisionEntryDto[];
}

/** POST /api/decisions 入参（goal/status 可选，对齐 server CreateDecisionBody） */
export interface CreateDecisionInput {
  question: string;
  goal?: string;
  status?: DecisionStatus; // 缺省 considering（B1）
  type?: DecisionType | null; // 缺省 not_sure（F2）
}

/** POST /api/decisions/[id] 入参（PATCH 语义，状态推进 + Save） */
export interface UpdateDecisionInput {
  status?: DecisionStatus;
  question?: string;
  type?: DecisionType | null;
  /** Keep this：saved + yourselfContext 一次提交（F4） */
  saved?: boolean;
  yourselfContext?: string;
}

/** POST /api/decisions/[id]/entries 入参（append-only） */
export interface AppendEntryInput {
  text: string;
  status?: DecisionStatus; // 缺省沿用决策当前 status，前端不传
  occurredAt?: string; // ISO，缺省 now
}
