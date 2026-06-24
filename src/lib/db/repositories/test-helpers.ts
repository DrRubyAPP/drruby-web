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
  "insightRagLog",
  "insightFeed",
  "modelValidationLog",
  "sisResponseLog",
  "userProtocolConfig",
  "cohortInsight",
  "expertSource",
  "lifestyleLog",
  "healthMilestone",
  "healthJourney",
  "clinicRecord",
  "confounderLog",
  "interventionLog",
  "sisHistory",
  "featureVector",
  "imageInfo",
  "deviceCapture",
  "studySession",
  "glucoseStream",
  "wearableDaily",
  "wearableConnection",
  "hormonalStatusLog",
  "userBaseline",
  "userAccount",
] as const;

export async function resetDatabase(): Promise<void> {
  // 按 FK 依赖逆序删除
  for (const table of TABLE_ORDER_FOR_CLEANUP) {
    // @ts-expect-error: 动态访问 model，测试辅助函数不追求类型安全
    await prisma[table].deleteMany({});
  }
}
