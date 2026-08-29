import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { toDecisionDTO } from "../../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Reopen decision
 * @description CLOSED → ACTIVE 原子事务：归档 entry（kind=archived_outcome + synthesis）+ 清空 outcome/nextStep/decidedAt + 置 ACTIVE。不写 freshnessCheckedAt（D6：仅 Check now 才写）。越权 404；非 CLOSED 422
 * @response DecisionItemResponse
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
  if (existing.lifecycle !== "CLOSED") {
    throw new AppError("UNPROCESSABLE_ENTITY", "仅 CLOSED 决策可 Reopen", 422);
  }

  const row = await decisionRepo.reopenAtomic(id, user.id);
  return NextResponse.json(toDecisionDTO(row, { withBrief: false }));
});
