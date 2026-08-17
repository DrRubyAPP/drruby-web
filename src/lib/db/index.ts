/**
 * DrRuby DB 层汇总入口
 *
 * 用法：
 *   import { prisma, userAccountRepo, userBaselineRepo } from "@/lib/db";
 *
 * 注意：
 * - prisma 单例只能在 server 端使用（server 组件 / route handler / server actions）
 * - repository 函数均为 async，写入前用 Zod 校验枚举字段
 * - 软删除过滤：Prisma 不自动过滤 deleted_at，调用方需显式 where: { deletedAt: null }
 */

export * from "./enums";
export { prisma } from "./prisma";
export * as bodyInsightRepo from "./repositories/bodyInsight.repo";
export * as consentSettingRepo from "./repositories/consentSetting.repo";
export * as contributionRepo from "./repositories/contribution.repo";
export * as decisionRepo from "./repositories/decision.repo";
export * as decisionEntryRepo from "./repositories/decisionEntry.repo";
export * as experimentRepo from "./repositories/experiment.repo";
export * as healthRecordRepo from "./repositories/healthRecord.repo";
export * as hormoneReadingRepo from "./repositories/hormoneReading.repo";
export * as researchStudyRepo from "./repositories/researchStudy.repo";
export * as signalRepo from "./repositories/signal.repo";
export * as skinScanRepo from "./repositories/skinScan.repo";
export * as studyEnrollmentRepo from "./repositories/studyEnrollment.repo";
export * as timelineEventRepo from "./repositories/timelineEvent.repo";
export * as userAccountRepo from "./repositories/userAccount.repo";
export * as userBaselineRepo from "./repositories/userBaseline.repo";
export * as appointmentRepo from "./repositories/clinic/appointment.repo";
export * as patientRepo from "./repositories/clinic/patient.repo";
export * as skinArchiveRepo from "./repositories/clinic/skinArchive.repo";
