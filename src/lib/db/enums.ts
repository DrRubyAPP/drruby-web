import { z } from "zod";

/**
 * DrRuby 数据模型枚举集中定义
 *
 * 数据模型主线：a_docs/drruby-docs/backend_v5.md §3（消费域主干 + P2/P3）
 * 研究域枚举已随 task-9 sub-plan-1/3 裁减（study_session / image_info / sis_history /
 * intervention_log / glucose_stream / 健康旅程域 / 知识 Loop 域）。
 *
 * 约定：所有枚举一律用 String + Zod 校验，不使用 Postgres 原生 ENUM。
 */

// =============================================================================
// 账号域
// =============================================================================

/** user_account.auth_provider：首次注册来源（非登录能力开关） */
export const authProviderSchema = z.enum(["email", "google"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

/** user_account.role：user（消费者）| clinic（诊所员工）| collaborator（科研协作者，verified）| admin（管理后台） */
export const userRoleSchema = z.enum([
  "user",
  "clinic",
  "collaborator",
  "admin",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** user_account.subscription_tier / subscription.tier：backend_v5 §2.6 两档 */
export const subscriptionTierSchema = z.enum(["free", "decision"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

/** user_account.status：登录时校验，非 active 拒绝 */
export const userStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

// =============================================================================
// 基线 / 激素
// =============================================================================

/**
 * user_baseline.hormonal_status / hormonal_status_log.status 共用 7 值
 * 生成 insight 时须读 hormonal_status_log 完整历史
 */
export const hormonalStatusSchema = z.enum([
  "cycling",
  "pregnant",
  "perimenopausal",
  "postmenopausal_lt5y",
  "postmenopausal_gt5y",
  "on_hrt",
  "on_contraceptive",
]);
export type HormonalStatus = z.infer<typeof hormonalStatusSchema>;

// =============================================================================
// Wearable 域
// =============================================================================

/** wearable_connection.provider / wearable_daily.provider：MVP 仅 apple_healthkit 真实写入 */
export const wearableProviderSchema = z.enum([
  "apple_healthkit",
  "oura",
  "dexcom",
  "libre",
  "whoop",
  "ultrahuman",
  "health_connect",
]);
export type WearableProvider = z.infer<typeof wearableProviderSchema>;

/** wearable_connection.status：revoked → UI "需要重新授权" banner */
export const connectionStatusSchema = z.enum(["active", "revoked"]);
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;

/** wearable_daily.data_quality */
export const dataQualitySchema = z.enum(["complete", "partial", "missing"]);
export type DataQuality = z.infer<typeof dataQualitySchema>;

/** 通用趋势：health_journey 基线趋势 / skin_archive.trend（P3）共用 */
export const trendSchema = z.enum(["improving", "stable", "declining"]);
export type Trend = z.infer<typeof trendSchema>;

// =============================================================================
// 占位枚举（基线仍用，待确认后收紧）
// =============================================================================

/**
 * user_baseline.skin_type
 * TODO: 未列具体值，待确认后改为 z.enum([...])
 */
export const skinTypeSchema = z.string();
export type SkinType = z.infer<typeof skinTypeSchema>;

/**
 * user_baseline.fitzpatrick_scale
 * TODO: 未列具体值，待确认后改为 z.enum(["I","II","III","IV","V","VI"])
 */
export const fitzpatrickScaleSchema = z.string();
export type FitzpatrickScale = z.infer<typeof fitzpatrickScaleSchema>;

// =============================================================================
// 消费决策域（App types.ts 契约）
// =============================================================================

/** timeline_event.kind */
export const timelineKindSchema = z.enum([
  "note",
  "treatment",
  "photo",
  "lab",
  "decision",
  "outcome",
]);
export type TimelineKind = z.infer<typeof timelineKindSchema>;

/** signal.confidence — App ConfidenceLevel（注意连字符 not-assessable） */
export const signalConfidenceSchema = z.enum([
  "observed",
  "possible",
  "not-assessable",
]);
export type SignalConfidence = z.infer<typeof signalConfidenceSchema>;

/** signal.trend — App Signal.trend */
export const signalTrendSchema = z.enum(["up", "down", "flat"]);
export type SignalTrend = z.infer<typeof signalTrendSchema>;

/** decision.lifecycle — Contract §5 生命周期 6 值（默认 ACTIVE） */
export const decisionLifecycleSchema = z.enum([
  "ACTIVE",
  "DECIDED",
  "OBSERVING",
  "LEARNING",
  "COMPLETED",
  "CLOSED",
]);
export type DecisionLifecycle = z.infer<typeof decisionLifecycleSchema>;

/** decision.decisionKind — Contract §3 Type A/B（用户永不见字面；默认 unconfirmed） */
export const decisionKindSchema = z.enum([
  "action",
  "exploration",
  "unconfirmed",
]);
export type DecisionKind = z.infer<typeof decisionKindSchema>;

/** Type A outcome 集（action） */
export const TYPE_A_OUTCOMES = [
  "still_considering",
  "decided_to_do_it",
  "decided_not_to",
  "talk_with_clinician_first",
] as const;
/** Type B outcome 集（exploration） */
export const TYPE_B_OUTCOMES = [
  "keep_exploring",
  "discuss_with_clinician",
  "come_back_later",
  "decided_on_next_step",
] as const;

/** decision.outcome — 8 值并集，可空（未决） */
export const outcomeSchema = z.enum([...TYPE_A_OUTCOMES, ...TYPE_B_OUTCOMES]);
export type DecisionOutcome = z.infer<typeof outcomeSchema>;

/**
 * 分组校验：给定 decisionKind 校验 outcome 是否合法。
 * - unconfirmed → outcome 必须为 null/undefined
 * - action → 仅 TYPE_A_OUTCOMES；exploration → 仅 TYPE_B_OUTCOMES
 * 非法组合抛错（调用方在 API 层映射为 422）。
 */
export function assertOutcomeForKind(
  kind: DecisionKind,
  outcome?: DecisionOutcome | null,
): void {
  if (kind === "unconfirmed") {
    if (outcome != null) {
      throw new Error("unconfirmed decision must not carry an outcome");
    }
    return;
  }
  if (outcome == null) return; // 未决合法
  const set: readonly string[] =
    kind === "action" ? TYPE_A_OUTCOMES : TYPE_B_OUTCOMES;
  if (!set.includes(outcome)) {
    throw new Error(`outcome "${outcome}" is not valid for kind "${kind}"`);
  }
}

/** outcome → 期望 lifecycle 映射（§3/§5）；B8：V1 中 decided_on_next_step 停在 DECIDED */
export const LIFECYCLE_FOR_OUTCOME: Record<DecisionOutcome, DecisionLifecycle> =
  {
    // Type A (action)
    still_considering: "ACTIVE",
    decided_to_do_it: "DECIDED",
    decided_not_to: "CLOSED",
    talk_with_clinician_first: "ACTIVE",
    // Type B (exploration)
    keep_exploring: "ACTIVE",
    discuss_with_clinician: "ACTIVE",
    come_back_later: "ACTIVE",
    decided_on_next_step: "DECIDED",
  };

/** 服务端按 outcome 派生 lifecycle（route 层调用） */
export function lifecycleForOutcome(
  outcome: DecisionOutcome,
): DecisionLifecycle {
  return LIFECYCLE_FOR_OUTCOME[outcome];
}

/**
 * outcome↔lifecycle 一致性校验（与 assertOutcomeForKind 配对）。
 * - outcome=null/undefined → lifecycle 不得为 DECIDED/CLOSED
 * - outcome 非空 → lifecycle 必须 === LIFECYCLE_FOR_OUTCOME[outcome]
 * 非法组合抛错（route 映射为 422）。
 */
export function assertLifecycleForOutcome(
  outcome: DecisionOutcome | null | undefined,
  lifecycle: DecisionLifecycle,
): void {
  if (outcome == null) {
    if (lifecycle === "DECIDED" || lifecycle === "CLOSED") {
      throw new Error(`lifecycle "${lifecycle}" requires a non-null outcome`);
    }
    return;
  }
  const expected = LIFECYCLE_FOR_OUTCOME[outcome];
  if (lifecycle !== expected) {
    throw new Error(
      `outcome "${outcome}" expects lifecycle "${expected}", got "${lifecycle}"`,
    );
  }
}

/** 非抛出版：判定 outcome 是否属于给定 kind 的合法集（B6 reclassify 自动清空时用） */
export function isValidOutcomeForKind(
  kind: DecisionKind,
  outcome: DecisionOutcome,
): boolean {
  if (kind === "unconfirmed") return false;
  const set: readonly string[] =
    kind === "action" ? TYPE_A_OUTCOMES : TYPE_B_OUTCOMES;
  return set.includes(outcome);
}

/** DecisionEntry.kind — §6 append-only entry 类型；null=历史 observation（向后兼容） */
export const decisionEntryKindSchema = z.enum([
  "observation",
  "archived_outcome",
]);
export type DecisionEntryKind = z.infer<typeof decisionEntryKindSchema>;

/** decision.topicSlug — 已知语料实体 slug（可空；null=无 topic 或未命中）
 *  仅驱动语料检索；与粗粒度 decisionType 正交。Journey.decisionType 亦复用此集。 */
export const topicSlugSchema = z.enum([
  "thermage",
  "ultherapy",
  "botox",
  "laser",
  "filler",
  "hrt",
  "skincare",
  "clinic",
]);
export type TopicSlug = z.infer<typeof topicSlugSchema>;

/** decision.type — 粗粒度决策种类（可空；缺省 not_sure，只影响 Science 措辞框架） */
export const decisionTypeSchema = z.enum([
  "procedure",
  "medication",
  "treatment",
  "test",
  "supplement",
  "lifestyle",
  "product",
  "not_sure",
]);
export type DecisionType = z.infer<typeof decisionTypeSchema>;

/** research_study.recruitment_status */
export const studyRecruitmentStatusSchema = z.enum([
  "recruiting",
  "closed",
  "completed",
]);
export type StudyRecruitmentStatus = z.infer<
  typeof studyRecruitmentStatusSchema
>;

/** study_enrollment.status — App Study.status */
export const studyEnrollmentStatusSchema = z.enum([
  "enrolled",
  "invited",
  "completed",
]);
export type StudyEnrollmentStatus = z.infer<typeof studyEnrollmentStatusSchema>;

/** consent_setting.key — 三档隐私开关 */
export const consentKeySchema = z.enum([
  "self",
  "deidentified_contribution",
  "identified_research",
]);
export type ConsentKey = z.infer<typeof consentKeySchema>;

/** body_insight.kind */
export const bodyInsightKindSchema = z.enum([
  "attention",
  "aging_velocity",
  "pattern",
  "change",
]);
export type BodyInsightKind = z.infer<typeof bodyInsightKindSchema>;

/** body_insight.accent（attention 卡）— App attention.accent */
export const insightAccentSchema = z.enum(["red", "amber", "purple"]);
export type InsightAccent = z.infer<typeof insightAccentSchema>;

/** body_insight.tone（aging）— App AgingMetric.tone */
export const insightToneSchema = z.enum(["green", "amber", "purple"]);
export type InsightTone = z.infer<typeof insightToneSchema>;

/** experiment.status — App Experiment.status */
export const experimentStatusSchema = z.enum(["running", "planned", "done"]);
export type ExperimentStatus = z.infer<typeof experimentStatusSchema>;

/** health_record.kind — task-42 D6：manual log 实体统一承载，扩展 medication/symptom/treatment */
export const healthRecordKindSchema = z.enum([
  "lab",
  "imaging",
  "checkup",
  "vitals",
  "medication",
  "symptom",
  "treatment",
]);
export type HealthRecordKind = z.infer<typeof healthRecordKindSchema>;

/**
 * health_record.ocr_status — 旧字段，task-42 起由 status/confidence 替代。
 * @deprecated task-42 起 status/confidence 替代；存量 ocrStatus 仅用于迁移映射。
 *  pending/processing → status=PROCESSING；done/manual → status=CONFIRMED
 */
export const ocrStatusSchema = z.enum(["pending", "processing", "done", "manual"]);
export type OcrStatus = z.infer<typeof ocrStatusSchema>;

// =============================================================================
// My Health 摄入域（Contract §2/§12-§14）— task-42
// =============================================================================

/** health_record.status — Contract §12 Source→Record 状态机 */
export const healthRecordStatusSchema = z.enum([
  "SOURCE_UPLOADED",
  "PROCESSING",
  "EXTRACTED_DRAFT",
  "USER_REVIEW",
  "CONFIRMED",
]);
export type HealthRecordStatus = z.infer<typeof healthRecordStatusSchema>;

/** Contract §13 抽取置信（替换 ocrStatus 的置信语义） */
export const extractionConfidenceSchema = z.enum([
  "High",
  "Low",
  "Unrecognized",
  "Conflicting",
]);
export type ExtractionConfidence = z.infer<typeof extractionConfidenceSchema>;

/** 文档分类（task-36 A4，细化现有粗粒度 kind） */
export const documentClassSchema = z.enum([
  "Lab",
  "Imaging",
  "Pathology",
  "Procedure",
  "VisitSummary",
  "Unknown",
]);
export type DocumentClass = z.infer<typeof documentClassSchema>;

/** ai_report.type — task-26 AI 报告域 */
export const aiReportTypeSchema = z.enum(["skin", "hormone", "body"]);
export type AiReportType = z.infer<typeof aiReportTypeSchema>;

/** ai_report.findings[].level — 对齐前端 mock AIReport.findings.level */
export const findingLevelSchema = z.enum(["good", "warn", "alert"]);
export type FindingLevel = z.infer<typeof findingLevelSchema>;

/** subscription.status */
export const subscriptionStatusSchema = z.enum([
  "active",
  "canceled",
  "past_due",
  "trialing",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// =============================================================================
// P2 / P3（B 端）— schema only 本轮，枚举先建齐供后续 repo 用
// =============================================================================

/** journey.source_type */
export const journeySourceTypeSchema = z.enum([
  "founder_interview",
  "verified_member",
  "partner_clinic",
  "research_study",
]);
export type JourneySourceType = z.infer<typeof journeySourceTypeSchema>;

/** notification_preference.key — privacy 视图通知偏好开关（固定 4 项） */
export const notificationPrefKeySchema = z.enum([
  "weekly_digest",
  "decision_followups",
  "study_updates",
  "product_updates",
]);
export type NotificationPrefKey = z.infer<typeof notificationPrefKeySchema>;

/** follow_up_task.status */
export const followUpStatusSchema = z.enum(["open", "done", "dismissed"]);
export type FollowUpStatus = z.infer<typeof followUpStatusSchema>;

/** clinic.plan_tier */
export const clinicPlanTierSchema = z.enum(["basic", "full"]);
export type ClinicPlanTier = z.infer<typeof clinicPlanTierSchema>;

/** authorization.status */
export const authorizationStatusSchema = z.enum(["active", "revoked"]);
export type AuthorizationStatus = z.infer<typeof authorizationStatusSchema>;

/** authorization_audit.action */
export const authorizationActionSchema = z.enum([
  "granted",
  "revoked",
  "scope_changed",
  "accessed",
]);
export type AuthorizationAction = z.infer<typeof authorizationActionSchema>;

/** appointment.status */
export const appointmentStatusSchema = z.enum([
  "scheduled",
  "done",
  "report_review",
  "consultation",
  "canceled",
]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

/** clinic_report.status（Review Queue 状态机） */
export const reviewStatusSchema = z.enum([
  "ai_drafted",
  "in_review",
  "approved",
  "sent",
]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/** referral.status */
export const referralStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "completed",
]);
export type ReferralStatus = z.infer<typeof referralStatusSchema>;

/** invoice.status */
export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "void"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** treatment.status */
export const treatmentStatusSchema = z.enum([
  "planned",
  "in_progress",
  "done",
  "canceled",
]);
export type TreatmentStatus = z.infer<typeof treatmentStatusSchema>;

/** treatment.type */
export const treatmentTypeSchema = z.enum([
  "thermage",
  "ultherapy",
  "botox",
  "laser",
  "filler",
  "hrt",
  "skincare",
  "other",
]);
export type TreatmentType = z.infer<typeof treatmentTypeSchema>;

/** crm_activity.type */
export const crmActivityTypeSchema = z.enum([
  "call",
  "email",
  "note",
  "follow_up",
  "message",
]);
export type CrmActivityType = z.infer<typeof crmActivityTypeSchema>;

/** crm_activity.status */
export const crmActivityStatusSchema = z.enum(["open", "done", "dismissed"]);
export type CrmActivityStatus = z.infer<typeof crmActivityStatusSchema>;
