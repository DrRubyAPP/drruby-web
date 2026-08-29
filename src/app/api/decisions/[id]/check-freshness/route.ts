import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Check freshness
 * @description V1 占位：写 freshnessCheckedAt=now，materialChange 恒 false。task-42/43 接入真实刷新 + material-change 检测后响应结构不变
 * @response { freshnessCheckedAt: string, materialChange: boolean }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await decisionRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  // V1 占位（B3）：仅写时间戳；task-42/43 替换为真实刷新
  const row = await decisionRepo.update(id, { freshnessCheckedAt: new Date() });
  const checkedAt = row.freshnessCheckedAt ?? new Date();
  return NextResponse.json({
    freshnessCheckedAt: checkedAt.toISOString(),
    materialChange: false,
  });
});
