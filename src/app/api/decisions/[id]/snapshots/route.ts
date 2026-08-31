import { NextResponse } from "next/server";
import { DecisionSnapshotDTO, toSnapshotDTO } from "@/app/api/decisions/dto";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo, decisionSnapshotRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** 复用 decision ownership 预检 */
async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/**
 * List snapshots (Current + History)
 * @description 当前 Current Snapshot + 历史快照列表（createdAt DESC）。可答"当时我知道什么/发生了什么变化/现在的理解"（§15）。越权 404
 * @response { current: DecisionSnapshotDTO|null, history: DecisionSnapshotDTO[] }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const [current, history] = await Promise.all([
    decisionSnapshotRepo.findCurrent(id),
    decisionSnapshotRepo.listHistoryByDecision(id),
  ]);

  return NextResponse.json({
    current: current ? DecisionSnapshotDTO.parse(toSnapshotDTO(current)) : null,
    history: history.map((s) => DecisionSnapshotDTO.parse(toSnapshotDTO(s))),
  });
});
