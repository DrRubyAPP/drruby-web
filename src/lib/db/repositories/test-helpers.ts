import { prisma } from "@/lib/db/prisma";

/**
 * 测试辅助：清理 DB 表数据
 *
 * repository 测试连本地真实 DB（docker compose up -d 起的 drruby 库），
 * 每个测试 beforeEach 调用 resetDatabase() 清空相关表，保证用例隔离。
 *
 * 注意：不使用 transaction rollback 模式——Prisma 的交互式事务与
 * $transaction(async fn) 对部分 DDL/cleanUp 行为有差异，直接 deleteMany 更直观。
 *
 * 清理顺序：先删依赖表（有 FK），再删被依赖表。
 */
const TABLE_ORDER_FOR_CLEANUP = [
  // P3 诊所门户 / 协作站（叶子在前）
  "authorizationAudit",
  "authorization",
  "clinicReport",
  "treatment",
  "crmActivity",
  "appointment",
  "invoice",
  "referral",
  "skinArchive",
  "clinicStaff",
  "protocol",
  "researchProject",
  "institution",
  "governanceDoc",
  "collaboratorProfile",
  "clinic",
  // P2 社区 / Library / 通知
  "journeyUpdate",
  "journey",
  "communityReply",
  "communityPost",
  "notification",
  "followUpTask",
  // P1 消费域
  "photo",
  "healthRecord",
  "subscription",
  "bodyInsight",
  "skinScan",
  "experiment",
  "hormoneReading",
  "contribution",
  "consentSetting",
  "studyEnrollment",
  "researchStudy",
  "decisionEntry", // 引用 decision，需先于 decision
  "timelineEvent", // 引用 decision，需先于 decision
  "decision",
  "signal",
  // 保留域（wearable / 激素 / baseline）
  "wearableDaily",
  "wearableConnection",
  "hormonalStatusLog",
  "userBaseline",
  // 认证
  "session",
  "account",
  "verification",
  "userAccount",
] as const;

export async function resetDatabase(): Promise<void> {
  // 按 FK 依赖逆序删除
  for (const table of TABLE_ORDER_FOR_CLEANUP) {
    // @ts-expect-error: 动态访问 model，测试辅助函数不追求类型安全
    await prisma[table].deleteMany({});
  }
}
