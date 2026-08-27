import { z } from "zod";
import { decisionStatusSchema } from "@/lib/db/enums";
import type { Decision, DecisionEntry } from "~prisma/client";

/** 三源 Decision Brief 快照（对齐 App `types.ts` DecisionBrief） */
export const DecisionBriefDTO = z.object({
  yourHistory: z.array(z.string()),
  similarJourneys: z.object({ summary: z.string(), note: z.string() }),
  evidence: z.object({
    known: z.array(z.string()),
    uncertain: z.array(z.string()),
  }),
  questionsForClinician: z.array(z.string()),
});

/** append-only 时间线条目（详情附带；App 忽略额外字段不破坏契约） */
export const DecisionEntryDTO = z.object({
  id: z.string(),
  text: z.string(),
  statusSnapshot: decisionStatusSchema,
  occurredAt: z.string(),
});

/** App `types.ts` Decision（`updated ← updatedAt`；列表省 brief，详情含 brief+entries） */
export const DecisionDTO = z.object({
  id: z.string(),
  question: z.string(),
  goal: z.string().nullable(),
  type: z.string().nullable(),
  status: decisionStatusSchema,
  saved: z.boolean(),
  yourselfContext: z.string().nullable(),
  updated: z.string(),
  brief: DecisionBriefDTO.optional(),
});

/** 详情：Decision + append-only entries（App 只消费 Decision 字段，entries 为附加） */
export const DecisionDetailDTO = DecisionDTO.extend({
  entries: z.array(DecisionEntryDTO),
});

/** brief 存 JSON，可空/缺失；仅当存在时解析形状（P2 前为快照/占位） */
function toBrief(brief: unknown): z.infer<typeof DecisionBriefDTO> | undefined {
  if (brief == null) return undefined;
  return DecisionBriefDTO.parse(brief);
}

export function toDecisionDTO(
  row: Decision,
  opts: { withBrief: boolean },
): z.infer<typeof DecisionDTO> {
  return {
    id: row.id,
    question: row.question,
    goal: row.goal,
    type: row.type,
    status: decisionStatusSchema.parse(row.status),
    saved: row.saved,
    yourselfContext: row.yourselfContext,
    updated: row.updatedAt.toISOString(),
    brief: opts.withBrief ? toBrief(row.brief) : undefined,
  };
}

export function toEntryDTO(
  row: DecisionEntry,
): z.infer<typeof DecisionEntryDTO> {
  return {
    id: row.id,
    text: row.text,
    statusSnapshot: decisionStatusSchema.parse(row.statusSnapshot),
    occurredAt: row.occurredAt.toISOString(),
  };
}
