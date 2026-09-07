import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireUser } from "@/lib/auth/session";
import {
  bodyInsightRepo,
  consentSettingRepo,
  contributionRepo,
  decisionEntryRepo,
  decisionRepo,
  experimentRepo,
  healthRecordRepo,
  hormoneReadingRepo,
  signalRepo,
  skinScanRepo,
  studyEnrollmentRepo,
  timelineEventRepo,
  userAccountRepo,
} from "@/lib/db";
import { bodyInsightKindSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";

/**
 * Export current user's data
 * @description 聚合当前用户全部关联数据为单个 JSON 导出（数据自主权：可携带/可审阅）。仅导出本人数据
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  // 全量导出是重操作（聚合多表）→ per-user 限流 6 req/min（Retry-After=10s）
  await rateLimit(user.id, {
    routeTag: "me-export",
    capacity: 6,
    refillRate: 0.1,
  });

  const account = await userAccountRepo.findById(user.id);
  if (!account) throw new AppError("NOT_FOUND", "账号不存在", 404);

  // 决策 + 其 append-only 时间线条目
  // task-50 D-10：软删 Decision 单独分区（deletedDecisions），活跃列表不含软删行
  const [decisions, deletedDecisions] = await Promise.all([
    decisionRepo.listByUser(user.id),
    decisionRepo.listByUserDeleted(user.id),
  ]);
  const toWithEntries = async (d: (typeof decisions)[number]) => ({
    ...d,
    entries: await decisionEntryRepo.listByDecision(d.id),
  });
  const decisionsWithEntries = await Promise.all(decisions.map(toWithEntries));
  const deletedDecisionsWithEntries = await Promise.all(
    deletedDecisions.map(toWithEntries),
  );

  // body_insight 覆盖全部 kind
  const insights = (
    await Promise.all(
      bodyInsightKindSchema.options.map((kind) =>
        bodyInsightRepo.listByUserAndKind(user.id, kind),
      ),
    )
  ).flat();

  const [
    timeline,
    signals,
    consent,
    contributions,
    studies,
    experiments,
    hormone,
    skinScanLatest,
    healthRecords,
  ] = await Promise.all([
    // P-2：导出完整时间线（含软删 Decision 关联事件，§14 provenance）
    timelineEventRepo.listByUser(user.id, {
      includeDeletedDecisionEvents: true,
    }),
    signalRepo.listByUser(user.id),
    consentSettingRepo.listByUser(user.id),
    contributionRepo.listByUser(user.id),
    studyEnrollmentRepo.listByUser(user.id),
    experimentRepo.listByUser(user.id),
    hormoneReadingRepo.listByUser(user.id),
    skinScanRepo.findLatest(user.id),
    healthRecordRepo.listByUser(user.id),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      subscriptionTier: account.subscriptionTier,
      memberSince: account.createdAt.toISOString(),
    },
    decisions: decisionsWithEntries,
    deletedDecisions: deletedDecisionsWithEntries,
    timeline,
    signals,
    consent,
    contributions,
    studies,
    experiments,
    hormone,
    skinScan: skinScanLatest,
    healthRecords,
    insights,
  });
});
