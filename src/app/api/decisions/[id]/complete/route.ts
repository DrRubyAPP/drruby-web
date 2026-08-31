import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { toDecisionDTO } from "../../dto";

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
}

/**
 * Mark as completed
 * @description D5 Mark as completed：DECIDED → COMPLETED 直接路径（不需观察的完成）。清 nextCheckInAt + observeBaseline + 刷 lastUserActivityAt + 写 TimelineEvent。非 DECIDED 422（OBSERVING 必须 Stop；ACTIVE 必须 Decide）。越权 404
 * @response DecisionDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  try {
    const decision = await decisionRepo.markCompleted({
      decisionId: id,
      userId: user.id,
    });
    return NextResponse.json(toDecisionDTO(decision, { withBrief: false }));
  } catch (e) {
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      (e as Error).message,
      422,
    );
  }
});
