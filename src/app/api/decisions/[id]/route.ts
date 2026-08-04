import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { decisionStatusSchema, decisionTypeSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { DecisionDTO, DecisionDetailDTO, toDecisionDTO, toEntryDTO } from "../dto";

/** 决策详情（含 brief 快照 + append-only entries） */
export const DecisionResponse = DecisionDetailDTO;

/** 更新决策入参（仅状态推进 + 可选 question/type；decided 时可写 decidedAt） */
export const UpdateDecisionBody = z.object({
  status: decisionStatusSchema.optional(),
  question: z.string().min(1).optional(),
  type: decisionTypeSchema.nullable().optional(),
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
 * @description 推进决策状态（可选改 question/type）；decided 时自动记 decidedAt。越权按 404 处理
 * @body UpdateDecisionBody
 * @response DecisionItemResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await decisionRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const body = UpdateDecisionBody.parse(await req.json());
  const row = await decisionRepo.update(id, {
    status: body.status,
    question: body.question,
    type: body.type,
    // 进入 decided 且此前未记录时，落定决策时间
    decidedAt:
      body.status === "decided" && !existing.decidedAt ? new Date() : undefined,
  });
  return NextResponse.json(toDecisionDTO(row, { withBrief: false }));
});
