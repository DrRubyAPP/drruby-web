import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { journeyRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { JourneyDetailDTO, toJourneyDTO, toJourneyUpdateDTO } from "../dto";

export const JourneyResponse = JourneyDetailDTO;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get journey detail
 * @description 单个 library journey 详情（含 version 正序的 living updates）；未共享/已撤回按 404 处理
 * @response JourneyResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  await requireUser();
  const { id } = await ctx.params;

  const row = await journeyRepo.findByIdWithUpdates(id);
  // 未共享 / 已撤回按「不存在」处理
  if (!row || !row.shared || row.withdrawnAt) {
    throw new AppError("NOT_FOUND", "Journey 不存在", 404);
  }

  const dto: z.infer<typeof JourneyDetailDTO> = {
    ...toJourneyDTO(row),
    updates: row.updates.map(toJourneyUpdateDTO),
  };
  return NextResponse.json(JourneyResponse.parse(dto));
});
