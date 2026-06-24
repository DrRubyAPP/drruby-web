import { z } from "zod";

/**
 * DrRuby 数据模型枚举集中定义
 *
 * 数据模型参考：a_docs/drruby-docs/mvp2/data-model-2.md
 * 红线 §0.3.6：所有枚举一律用 String + Zod 校验，不使用 Postgres 原生 ENUM
 * 红线 §0.3.3：intervention_log.category ⟺ cohort_insight.intervention_category 共用同一 schema
 * 红线 §0.3.2：face_side 统一 left/right（intervention_log 额外含 both）
 */

// =============================================================================
// 账号域
// =============================================================================

/** user_account.auth_provider：首次注册来源（非登录能力开关） */
export const authProviderSchema = z.enum(["email", "google"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

/** user_account.role：数据隔离 */
export const userRoleSchema = z.enum(["user", "clinic"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** user_account.subscription_tier */
export const subscriptionTierSchema = z.enum([
  "free",
  "paid",
  "premium",
  "vip",
]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

/** user_account.status：登录时校验，非 active 拒绝 */
export const userStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

// =============================================================================
// 基线 / 激素
// =============================================================================

/**
 * user_baseline.hormonal_status / hormonal_status_log.status 共用 7 值
 * RAG 生成 insight 时必须读 hormonal_status_log 完整历史
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
// 研究域 - study_session
// =============================================================================

/** study_session.status：状态机 pending_first_capture → active → (paused ⇄ active) → completed/abandoned */
export const studySessionStatusSchema = z.enum([
  "pending_first_capture",
  "active",
  "paused",
  "completed",
  "abandoned",
]);
export type StudySessionStatus = z.infer<typeof studySessionStatusSchema>;

/** study_session.washout_status */
export const washoutStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);
export type WashoutStatus = z.infer<typeof washoutStatusSchema>;

/** study_session.preferred_capture_window */
export const captureWindowSchema = z.enum(["morning", "midday", "evening"]);
export type CaptureWindow = z.infer<typeof captureWindowSchema>;

// =============================================================================
// 研究域 - face_side（红线 §0.3.2）
// =============================================================================

/** face_side 统一 left/right：image_info / feature_vector / clinic_record / study_session.intervention_side/control_side */
export const faceSideSchema = z.enum(["left", "right"]);
export type FaceSide = z.infer<typeof faceSideSchema>;

/**
 * intervention_log.face_side 额外含 both（基础护肤，不计入 cohort）
 * 注意：与 image_info/feature_vector/clinic_record 的 face_side 不共用——后者严格 left/right
 */
export const faceSideWithBothSchema = z.enum(["left", "right", "both"]);
export type FaceSideWithBoth = z.infer<typeof faceSideWithBothSchema>;

// =============================================================================
// 研究域 - image_info / device_capture / feature_vector
// =============================================================================

/** image_info.capture_device */
export const captureDeviceSchema = z.enum([
  "phone_front",
  "phone_rear",
  "dermoscope",
]);
export type CaptureDevice = z.infer<typeof captureDeviceSchema>;

/** image_info.mcs_level / sis_history.mcs_lowest：采集即时评分（大小写敏感） */
export const mcsLevelSchema = z.enum(["High", "Medium", "Low"]);
export type McsLevel = z.infer<typeof mcsLevelSchema>;

/** image_info.lighting_score：fail 不允许提交 */
export const lightingScoreSchema = z.enum(["pass", "fail"]);
export type LightingScore = z.infer<typeof lightingScoreSchema>;

/** device_capture.derm_magnification */
export const dermMagnificationSchema = z.enum(["10x", "20x", "50x"]);
export type DermMagnification = z.infer<typeof dermMagnificationSchema>;

/** device_capture.capture_quality */
export const captureQualitySchema = z.enum(["good", "fair", "poor"]);
export type CaptureQuality = z.infer<typeof captureQualitySchema>;

// =============================================================================
// 研究域 - sis_history
// =============================================================================

/** sis_history.status：2次→computed；1次→degraded；0次→skipped */
export const sisStatusSchema = z.enum(["computed", "degraded", "skipped"]);
export type SisStatus = z.infer<typeof sisStatusSchema>;

// =============================================================================
// 研究域 - intervention_log（红线 §0.3.3）
// =============================================================================

/**
 * intervention_log.category 与 cohort_insight.intervention_category 共用此 schema
 * 11 类：retinoid / moisturizer / sunscreen / serum_vitamin_c / serum_niacinamide /
 *       serum_peptide / eye_cream / exfoliant / supplement / procedure / other
 */
export const interventionCategorySchema = z.enum([
  "retinoid",
  "moisturizer",
  "sunscreen",
  "serum_vitamin_c",
  "serum_niacinamide",
  "serum_peptide",
  "eye_cream",
  "exfoliant",
  "supplement",
  "procedure",
  "other",
]);
export type InterventionCategory = z.infer<typeof interventionCategorySchema>;

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

/** glucose_stream.trend_arrow：Dexcom 对齐 7 级不可合并（↑↑ 是 AGE 风险关键信号） */
export const glucoseTrendSchema = z.enum([
  "double_up",
  "single_up",
  "forty_five_up",
  "flat",
  "forty_five_down",
  "single_down",
  "double_down",
]);
export type GlucoseTrend = z.infer<typeof glucoseTrendSchema>;

// =============================================================================
// 健康旅程域
// =============================================================================

/** health_journey.{sleep_baseline_trend, hrv_baseline_trend, sis_trajectory} */
export const trendSchema = z.enum(["improving", "stable", "declining"]);
export type Trend = z.infer<typeof trendSchema>;

/** health_milestone.milestone_type
 * TODO(task-?): §27-4 待 Brenner 定周数，sustained_?wk 占位值需替换 */
export const milestoneTypeSchema = z.enum([
  "first_positive_sis",
  "sustained_?wk",
  "clinic_elastometry_validated",
  "best_sis_ever",
  "sleep_improved",
  "lifestyle_correlated",
]);
export type MilestoneType = z.infer<typeof milestoneTypeSchema>;

/** lifestyle_log.change_type：8 类 */
export const changeTypeSchema = z.enum([
  "sleep_habit",
  "diet",
  "exercise",
  "stress_mgmt",
  "alcohol",
  "skincare_routine",
  "supplement",
  "medication",
]);
export type ChangeType = z.infer<typeof changeTypeSchema>;

/** insight_feed.insight_type：5 类 */
export const insightTypeSchema = z.enum([
  "skin_sleep_correlation",
  "sis_drop_explained",
  "lifestyle_skin_link",
  "milestone_approaching",
  "cohort_recommendation",
]);
export type InsightType = z.infer<typeof insightTypeSchema>;

// =============================================================================
// 知识/Loop 域
// =============================================================================

/** expert_source.expert_name */
export const expertNameSchema = z.enum([
  "brenner",
  "gunter",
  "skin_specialist",
]);
export type ExpertName = z.infer<typeof expertNameSchema>;

/** expert_source.content_type */
export const contentTypeSchema = z.enum([
  "paper",
  "protocol",
  "guideline",
  "annotation",
]);
export type ContentType = z.infer<typeof contentTypeSchema>;

/** expert_source.domain */
export const expertDomainSchema = z.enum([
  "hormone_skin",
  "barrier_function",
  "glycation",
  "photoaging",
  "elasticity",
  "formulation",
]);
export type ExpertDomain = z.infer<typeof expertDomainSchema>;

/** expert_source.verdict：仅 content_type=annotation，EvaluateMyStack 四色 */
export const verdictSchema = z.enum(["keep", "stop", "review", "caution"]);
export type Verdict = z.infer<typeof verdictSchema>;

/** cohort_insight.confidence_level */
export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

// =============================================================================
// Loop 域 - sis_response_log
// =============================================================================

/** sis_response_log.action_taken：SIS 页 onLoad 即写 viewed（被动查看捕捉） */
export const sisActionSchema = z.enum([
  "viewed",
  "changed_product",
  "continued",
  "paused",
  "skipped",
]);
export type SisAction = z.infer<typeof sisActionSchema>;

// =============================================================================
// 占位枚举（待 §27 确认后收紧）
// =============================================================================

/**
 * user_baseline.skin_type / cohort_insight.skin_type
 * TODO: data-model-2.md 未列具体值，待 §27 确认后改为 z.enum([...])
 */
export const skinTypeSchema = z.string();
export type SkinType = z.infer<typeof skinTypeSchema>;

/**
 * user_baseline.fitzpatrick_scale / cohort_insight.fitzpatrick_scale
 * TODO: data-model-2.md 未列具体值，待 §27 确认后改为 z.enum(["I","II","III","IV","V","VI"])
 */
export const fitzpatrickScaleSchema = z.string();
export type FitzpatrickScale = z.infer<typeof fitzpatrickScaleSchema>;
