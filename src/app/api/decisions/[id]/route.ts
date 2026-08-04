import { NextResponse } from "next/server";
import type { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { DecisionDetailDTO, toDecisionDTO, toEntryDTO } from "../dto";

/** 决策详情（含 brief 快照 + append-only entries） */
export const DecisionResponse = DecisionDetailDTO;

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
