import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { studyEnrollmentRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";

/** 退出结果 */
export const WithdrawResponse = z.object({
  studyId: z.string(),
  withdrawn: z.boolean(),
  consentGiven: z.boolean(),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Withdraw from study
 * @description 退出某研究（保留记录，标记 withdrawnAt + 收回同意）。未入组 → 404
 * @response WithdrawResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id: studyId } = await ctx.params;

  // 未入组不得退出
  const existing = await studyEnrollmentRepo.listByUser(user.id);
  if (!existing.some((e) => e.studyId === studyId)) {
    throw new AppError("NOT_FOUND", "未入组该研究", 404);
  }

  const enrollment = await studyEnrollmentRepo.withdraw(studyId, user.id);
  return NextResponse.json(
    WithdrawResponse.parse({
      studyId: enrollment.studyId,
      withdrawn: enrollment.withdrawnAt !== null,
      consentGiven: enrollment.consentGiven,
    }),
  );
});
