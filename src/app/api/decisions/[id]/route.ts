import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import {
  decisionKindSchema,
  decisionLifecycleSchema,
  decisionTypeSchema,
  outcomeSchema,
  topicSlugSchema,
} from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import {
  DecisionDetailDTO,
  DecisionDTO,
  toDecisionDTO,
  toEntryDTO,
} from "../dto";

/** 决策详情（含 brief 快照 + append-only entries） */
export const DecisionResponse = DecisionDetailDTO;

/** 更新决策入参（lifecycle 三维 + question/type/saved/yourselfContext） */
export const UpdateDecisionBody = z.object({
  question: z.string().min(1).optional(),
  type: decisionTypeSchema.nullable().optional(),
  topic: z.string().max(200).nullable().optional(),
  topicSlug: topicSlugSchema.nullable().optional(),
  lifecycle: decisionLifecycleSchema.optional(),
  decisionKind: decisionKindSchema.optional(),
  outcome: outcomeSchema.nullable().optional(),
  nextStep: z.string().max(500).nullable().optional(),
  saved: z.boolean().optional().describe("Keep this 置 true；Not-now 不传"),
  yourselfContext: z
    .string()
    .optional()
    .describe("Yourself 轻量文字背景（随 Keep 一并保存）"),
});
/** PATCH 返回的单个决策（省 brief） */
export const DecisionItemResponse = DecisionDTO;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get decision detail
 * @description 单个决策详情（含三源 brief 快照与 append-only 时间线条目）
 * @response DecisionResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const row = await decisionRepo.findByIdWithEntries(id);
  // 越权按「不存在」处理：不泄露他人资源是否存在
  if (!row || row.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const dto: z.infer<typeof DecisionDetailDTO> = {
    ...toDecisionDTO(row, { withBrief: true }),
    entries: row.entries.map(toEntryDTO),
  };
  return NextResponse.json(DecisionResponse.parse(dto));
});

/**
 * Update decision
 * @description 更新决策 lifecycle 三维（decisionKind/outcome/nextStep/lifecycle）与 question/type/saved/yourselfContext。非法 kind↔outcome 组合 422；越权按 404 处理
 * @body UpdateDecisionBody
 * @response DecisionItemResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await decisionRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const body = UpdateDecisionBody.parse(await req.json());
  let row: Awaited<ReturnType<typeof decisionRepo.update>>;
  try {
    row = await decisionRepo.update(id, {
      question: body.question,
      type: body.type,
      topic: body.topic,
      topicSlug: body.topicSlug,
      lifecycle: body.lifecycle,
      decisionKind: body.decisionKind,
      outcome: body.outcome,
      nextStep: body.nextStep,
      saved: body.saved,
      yourselfContext: body.yourselfContext,
    });
  } catch (err) {
    // repo 的 assertOutcomeForKind 抛普通 Error → 非法 kind↔outcome 组合（B1）
    if (err instanceof AppError) throw err;
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      err instanceof Error ? err.message : "非法的 outcome 组合",
      422,
      { cause: err },
    );
  }
  return NextResponse.json(toDecisionDTO(row, { withBrief: false }));
});
