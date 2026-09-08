import { NextResponse } from "next/server";
import { AiStateDTO } from "@/app/api/decisions/dto";
import { computeAiState } from "@/lib/ai/synthesis/aiState";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo, decisionSnapshotRepo } from "@/lib/db";
import { listByDecision } from "@/lib/db/repositories/decisionHealthRecord.repo";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/**
 * Get AI states
 * @description §24–§26 五态状态机（yourself/others/science 各自独立）。rule-based，不依赖 LLM。Failed 由 lastRegenFailed 信号（V1 默认 false）；STALE 返回 pendingUntil；INSUFFICIENT 分三视角文案。越权 404
 * @response AiStateDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const existing = await assertDecisionOwner(user.id, id);

  // 检查 currentSnapshotId + pendingRegenAt
  const hasCurrentSnapshot = existing.currentSnapshotId != null;
  const pendingRegenAt = existing.pendingRegenAt;

  // 检查 healthContext / yourselfContext / connected Records
  const healthContext = existing.healthContext as Record<
    string,
    unknown
  > | null;
  const hasHealthContext =
    !!healthContext &&
    typeof healthContext === "object" &&
    Object.keys(healthContext).length > 0;
  const hasYourselfContext =
    !!existing.yourselfContext && existing.yourselfContext.trim().length > 0;

  const links = await listByDecision(id);
  const hasConnectedRecords = links.length > 0;

  // null / 未命中 topicSlug 走 GENERIC fallback，但 §25 算证据不足。
  const topicSlugHitCorpus = existing.topicSlug != null;

  const result = computeAiState({
    hasCurrentSnapshot,
    pendingRegenAt,
    hasHealthContext,
    hasYourselfContext,
    hasConnectedRecords,
    topicSlugHitCorpus,
    lastRegenFailed: existing.lastRegenFailedAt != null,
  });

  return NextResponse.json(
    AiStateDTO.parse({
      yourself: result.yourself,
      others: result.others,
      science: result.science,
      pendingUntil: result.pendingUntil
        ? result.pendingUntil.toISOString()
        : null,
    }),
  );
});
