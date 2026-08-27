import {
  type DecisionStatus,
  type DecisionType,
  decisionStatusSchema,
  decisionTypeSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Decision, Prisma } from "~prisma/client";

/** 四源 brief 快照（P1 存 JSON，结构对齐 App DecisionBrief） */
export interface DecisionBriefSnapshot {
  yourHistory: string[];
  similarJourneys: { summary: string; note: string };
  evidence: { known: string[]; uncertain: string[] };
  questionsForClinician: string[];
}

export interface CreateDecisionInput {
  question: string;
  /** 该决策服务的目标（对齐 concern_goals 词汇；Slice 1 起可选） */
  goal?: string | null;
  /** 缺省 considering */
  status?: DecisionStatus;
  type?: DecisionType | null;
  brief?: DecisionBriefSnapshot | null;
}

export interface UpdateDecisionInput {
  question?: string;
  status?: DecisionStatus;
  type?: DecisionType | null;
  /** Keep this 置 true；Not-now 不置（保持 false） */
  saved?: boolean;
  /** Yourself 轻量文字背景（可编辑，随 Keep 一并保存；不写入 brief） */
  yourselfContext?: string | null;
  brief?: DecisionBriefSnapshot | null;
  decidedAt?: Date | null;
}

function validateStatus(s?: DecisionStatus): void {
  if (s !== undefined) decisionStatusSchema.parse(s);
}
function validateType(t?: DecisionType | null): void {
  if (t !== undefined && t !== null) decisionTypeSchema.parse(t);
}

export async function create(
  userId: string,
  input: CreateDecisionInput,
): Promise<Decision> {
  validateStatus(input.status);
  validateType(input.type);
  return prisma.decision.create({
    data: {
      userId,
      question: input.question,
      goal: input.goal ?? null,
      status: input.status ?? "considering",
      type: input.type ?? "not_sure",
      brief: (input.brief ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function update(
  id: string,
  input: UpdateDecisionInput,
): Promise<Decision> {
  validateStatus(input.status);
  validateType(input.type);
  const { brief, ...rest } = input;
  return prisma.decision.update({
    where: { id },
    data: {
      ...rest,
      brief:
        brief === undefined
          ? undefined
          : (brief as unknown as Prisma.InputJsonValue),
    },
  });
}

export async function listByUser(userId: string): Promise<Decision[]> {
  return prisma.decision.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

/** 仅 saved=true（"可检索 = saved"；Not-now 落库但不出现在任何列表） */
export async function listByUserSaved(userId: string): Promise<Decision[]> {
  return prisma.decision.findMany({
    where: { userId, saved: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findById(id: string): Promise<Decision | null> {
  return prisma.decision.findUnique({ where: { id } });
}

/** 详情：含 append-only entries（时间正序） */
export async function findByIdWithEntries(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: { entries: { orderBy: { occurredAt: "asc" } } },
  });
}
