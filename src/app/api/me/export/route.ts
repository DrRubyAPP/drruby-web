import { NextResponse } from "next/server";
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

  const account = await userAccountRepo.findById(user.id);
  if (!account) throw new AppError("NOT_FOUND", "账号不存在", 404);

  // 决策 + 其 append-only 时间线条目
  const decisions = await decisionRepo.listByUser(user.id);
  const decisionsWithEntries = await Promise.all(
    decisions.map(async (d) => ({
      ...d,
      entries: await decisionEntryRepo.listByDecision(d.id),
    })),
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
    timelineEventRepo.listByUser(user.id),
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
