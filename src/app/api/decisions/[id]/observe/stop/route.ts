import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
}

/**
 * Stop observing
 * @description §27 Stop Observing：OBSERVING → LEARNING（有 observations）或 COMPLETED（无 observations）原子事务。清 nextCheckInAt；observeBaseline 保留到 markCompleted 时清空（D7 不删历史）。刷 lastUserActivityAt + 写 TimelineEvent。非 OBSERVING 422。越权 404
 * @response { lifecycle: "LEARNING" | "COMPLETED", hasObservations: boolean }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  try {
    const result = await decisionRepo.stopObserving({
      decisionId: id,
      userId: user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      (e as Error).message,
      422,
    );
  }
});
