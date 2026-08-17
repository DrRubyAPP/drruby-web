import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { aiReportRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { AiReportDTO, toAiReportDTO } from "../route";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get AI report detail
 * @description 获取单条 AI 报告详情。非本人报告按 404 处理（不暴露存在性）。
 * @response AiReportDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const row = await aiReportRepo.findById(id);
  if (!row || row.userId !== user.id) {
    throw new AppError("NOT_FOUND", "报告不存在", 404);
  }
  return NextResponse.json(AiReportDTO.parse(toAiReportDTO(row)));
});
