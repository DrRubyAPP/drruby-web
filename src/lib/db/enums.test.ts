import { describe, expect, it } from "vitest";
import {
  aiStateSchema,
  appointmentStatusSchema,
  assertCanCompleteAfterLearning,
  assertCanMarkCompleted,
  assertCanStartObserving,
  assertCanStopObserving,
  assertOutcomeForKind,
  authorizationActionSchema,
  authorizationStatusSchema,
  authProviderSchema,
  bodyInsightKindSchema,
  changeTriggerSchema,
  checkInFrequencySchema,
  CHECK_IN_FREQ_MS,
  clinicPlanTierSchema,
  connectionStatusSchema,
  consentKeySchema,
  dataQualitySchema,
  decisionEntryKindSchema,
  decisionKindSchema,
  decisionLifecycleSchema,
  decisionTypeSchema,
  documentClassSchema,
  experimentStatusSchema,
  extractionConfidenceSchema,
  fitzpatrickScaleSchema,
  followUpStatusSchema,
  healthContextCategorySchema,
  healthContextStatusSchema,
  healthRecordKindSchema,
  healthRecordStatusSchema,
  hormonalStatusSchema,
  insightAccentSchema,
  insightToneSchema,
  invoiceStatusSchema,
  journeySourceTypeSchema,
  observationDirectionSchema,
  ocrStatusSchema,
  referralStatusSchema,
  reviewStatusSchema,
  signalConfidenceSchema,
  signalTrendSchema,
  skinTypeSchema,
  studyEnrollmentStatusSchema,
  studyRecruitmentStatusSchema,
  subscriptionStatusSchema,
  subscriptionTierSchema,
  synthesisProvenanceSchema,
  timelineKindSchema,
  topicSlugSchema,
  trendSchema,
  userRoleSchema,
  userStatusSchema,
  wearableProviderSchema,
} from "@/lib/db/enums";

describe("保留枚举 - 有效值通过", () => {
  it("authProviderSchema = email/google", () => {
    expect(authProviderSchema.parse("email")).toBe("email");
    expect(authProviderSchema.parse("google")).toBe("google");
  });

  it("userRoleSchema = user/clinic/collaborator/admin", () => {
    for (const v of ["user", "clinic", "collaborator", "admin"]) {
      expect(userRoleSchema.parse(v)).toBe(v);
    }
  });

  it("subscriptionTierSchema = free/decision", () => {
    for (const v of ["free", "decision"]) {
      expect(subscriptionTierSchema.parse(v)).toBe(v);
    }
  });

  it("userStatusSchema = active/suspended/deleted", () => {
    for (const v of ["active", "suspended", "deleted"]) {
      expect(userStatusSchema.parse(v)).toBe(v);
    }
  });

  it("hormonalStatusSchema 接受 7 值", () => {
    for (const v of [
      "cycling",
      "pregnant",
      "perimenopausal",
      "postmenopausal_lt5y",
      "postmenopausal_gt5y",
      "on_hrt",
      "on_contraceptive",
    ]) {
      expect(hormonalStatusSchema.parse(v)).toBe(v);
    }
  });

  it("wearableProviderSchema 接受 7 值", () => {
    for (const v of [
      "apple_healthkit",
      "oura",
      "dexcom",
      "libre",
      "whoop",
      "ultrahuman",
      "health_connect",
    ]) {
      expect(wearableProviderSchema.parse(v)).toBe(v);
    }
  });

  it("connectionStatusSchema = active/revoked", () => {
    expect(connectionStatusSchema.parse("active")).toBe("active");
    expect(connectionStatusSchema.parse("revoked")).toBe("revoked");
  });

  it("dataQualitySchema = complete/partial/missing", () => {
    for (const v of ["complete", "partial", "missing"]) {
      expect(dataQualitySchema.parse(v)).toBe(v);
    }
  });

  it("trendSchema = improving/stable/declining", () => {
    for (const v of ["improving", "stable", "declining"]) {
      expect(trendSchema.parse(v)).toBe(v);
    }
  });

  it("skinTypeSchema / fitzpatrickScaleSchema 当前为占位 string", () => {
    expect(skinTypeSchema.parse("oily")).toBe("oily");
    expect(fitzpatrickScaleSchema.parse("II")).toBe("II");
  });
});

describe("消费决策域枚举 - 有效值通过", () => {
  it("timelineKindSchema 接受 6 值", () => {
    for (const v of [
      "note",
      "treatment",
      "photo",
      "lab",
      "decision",
      "outcome",
    ]) {
      expect(timelineKindSchema.parse(v)).toBe(v);
    }
  });

  it("signalConfidence 含连字符 not-assessable", () => {
    expect(signalConfidenceSchema.parse("not-assessable")).toBe(
      "not-assessable",
    );
    expect(signalConfidenceSchema.parse("observed")).toBe("observed");
    expect(() => signalConfidenceSchema.parse("unknown")).toThrow();
  });

  it("signalTrendSchema = up/down/flat", () => {
    for (const v of ["up", "down", "flat"]) {
      expect(signalTrendSchema.parse(v)).toBe(v);
    }
  });

  it("decisionLifecycleSchema 接受 6 值生命周期", () => {
    for (const v of [
      "ACTIVE",
      "DECIDED",
      "OBSERVING",
      "LEARNING",
      "COMPLETED",
      "CLOSED",
    ]) {
      expect(decisionLifecycleSchema.parse(v)).toBe(v);
    }
    expect(() => decisionLifecycleSchema.parse("active")).toThrow();
  });

  it("decisionKindSchema 接受 action/exploration/unconfirmed", () => {
    for (const v of ["action", "exploration", "unconfirmed"]) {
      expect(decisionKindSchema.parse(v)).toBe(v);
    }
    expect(() => decisionKindSchema.parse("typeA")).toThrow();
  });

  it("assertOutcomeForKind 按 kind 校验 outcome（分组）", () => {
    // unconfirmed → outcome 必须为 null/undefined
    expect(() => assertOutcomeForKind("unconfirmed", null)).not.toThrow();
    expect(() =>
      assertOutcomeForKind("unconfirmed", "still_considering"),
    ).toThrow();
    // action → 仅 A 集
    expect(() =>
      assertOutcomeForKind("action", "decided_to_do_it"),
    ).not.toThrow();
    expect(() => assertOutcomeForKind("action", "keep_exploring")).toThrow();
    // exploration → 仅 B 集
    expect(() =>
      assertOutcomeForKind("exploration", "keep_exploring"),
    ).not.toThrow();
    expect(() =>
      assertOutcomeForKind("exploration", "decided_to_do_it"),
    ).toThrow();
    // 未决（outcome=null）对 action/exploration 均合法
    expect(() => assertOutcomeForKind("action", null)).not.toThrow();
  });

  it("decisionTypeSchema 接受 8 类粗粒度种类", () => {
    for (const v of [
      "procedure",
      "medication",
      "treatment",
      "test",
      "supplement",
      "lifestyle",
      "product",
      "not_sure",
    ]) {
      expect(decisionTypeSchema.parse(v)).toBe(v);
    }
    // 实体值（旧 type）不再是合法 type
    expect(() => decisionTypeSchema.parse("thermage")).toThrow();
  });

  it("topicSlugSchema 接受 8 类实体 slug", () => {
    for (const v of [
      "thermage",
      "ultherapy",
      "botox",
      "laser",
      "filler",
      "hrt",
      "skincare",
      "clinic",
    ]) {
      expect(topicSlugSchema.parse(v)).toBe(v);
    }
    // not_sure 是粗粒度 type，不是 topicSlug
    expect(() => topicSlugSchema.parse("not_sure")).toThrow();
  });

  it("studyRecruitmentStatusSchema = recruiting/closed/completed", () => {
    for (const v of ["recruiting", "closed", "completed"]) {
      expect(studyRecruitmentStatusSchema.parse(v)).toBe(v);
    }
  });

  it("studyEnrollmentStatusSchema = enrolled/invited/completed", () => {
    for (const v of ["enrolled", "invited", "completed"]) {
      expect(studyEnrollmentStatusSchema.parse(v)).toBe(v);
    }
  });

  it("consentKey 三档", () => {
    for (const v of [
      "self",
      "deidentified_contribution",
      "identified_research",
    ]) {
      expect(consentKeySchema.parse(v)).toBe(v);
    }
    expect(() => consentKeySchema.parse("public")).toThrow();
  });

  it("bodyInsightKindSchema 接受 4 值", () => {
    for (const v of ["attention", "aging_velocity", "pattern", "change"]) {
      expect(bodyInsightKindSchema.parse(v)).toBe(v);
    }
  });

  it("insightAccentSchema = red/amber/purple", () => {
    for (const v of ["red", "amber", "purple"]) {
      expect(insightAccentSchema.parse(v)).toBe(v);
    }
  });

  it("insightToneSchema = green/amber/purple", () => {
    for (const v of ["green", "amber", "purple"]) {
      expect(insightToneSchema.parse(v)).toBe(v);
    }
  });

  it("experimentStatusSchema = running/planned/done", () => {
    for (const v of ["running", "planned", "done"]) {
      expect(experimentStatusSchema.parse(v)).toBe(v);
    }
  });

  it("healthRecordKindSchema = lab/imaging/checkup/vitals/medication/symptom/treatment", () => {
    for (const v of [
      "lab",
      "imaging",
      "checkup",
      "vitals",
      "medication",
      "symptom",
      "treatment",
    ]) {
      expect(healthRecordKindSchema.parse(v)).toBe(v);
    }
  });

  it("ocrStatusSchema = pending/processing/done/manual", () => {
    for (const v of ["pending", "processing", "done", "manual"]) {
      expect(ocrStatusSchema.parse(v)).toBe(v);
    }
  });

  it("healthRecordStatusSchema 接受 5 值（Contract §12 状态机）", () => {
    for (const v of [
      "SOURCE_UPLOADED",
      "PROCESSING",
      "EXTRACTED_DRAFT",
      "USER_REVIEW",
      "CONFIRMED",
    ]) {
      expect(healthRecordStatusSchema.parse(v)).toBe(v);
    }
    expect(() => healthRecordStatusSchema.parse("CONFIRM")).toThrow();
  });

  it("extractionConfidenceSchema 接受 4 值（Contract §13）", () => {
    for (const v of ["High", "Low", "Unrecognized", "Conflicting"]) {
      expect(extractionConfidenceSchema.parse(v)).toBe(v);
    }
    expect(() => extractionConfidenceSchema.parse("high")).toThrow(); // 大小写敏感
    expect(() => extractionConfidenceSchema.parse("MEDIUM")).toThrow();
  });

  it("documentClassSchema 接受 6 值（task-36 A4）", () => {
    for (const v of [
      "Lab",
      "Imaging",
      "Pathology",
      "Procedure",
      "VisitSummary",
      "Unknown",
    ]) {
      expect(documentClassSchema.parse(v)).toBe(v);
    }
    expect(() => documentClassSchema.parse("lab")).toThrow(); // 大小写敏感
    expect(() => documentClassSchema.parse("GENETIC")).toThrow();
  });

  it("subscriptionStatusSchema = active/canceled/past_due/trialing", () => {
    for (const v of ["active", "canceled", "past_due", "trialing"]) {
      expect(subscriptionStatusSchema.parse(v)).toBe(v);
    }
  });
});

describe("task-43 综合/状态机枚举 - 有效值通过", () => {
  it("aiStateSchema 接受 5 态（Contract §24）", () => {
    for (const v of [
      "LOADING",
      "READY",
      "INSUFFICIENT_INFORMATION",
      "FAILED",
      "STALE_UPDATE_AVAILABLE",
    ]) {
      expect(aiStateSchema.parse(v)).toBe(v);
    }
    // 大小写敏感
    expect(() => aiStateSchema.parse("loading")).toThrow();
    expect(() => aiStateSchema.parse("READY_TO_SHOW")).toThrow();
    expect(() => aiStateSchema.parse("INSUFFICIENT")).toThrow();
  });

  it("changeTriggerSchema 接受 6 值（§23 五值 + initial sentinel）", () => {
    for (const v of [
      "new_record",
      "health_context_update",
      "others_refresh",
      "science_refresh",
      "observation_update",
      "initial",
    ]) {
      expect(changeTriggerSchema.parse(v)).toBe(v);
    }
    expect(() => changeTriggerSchema.parse("new-record")).toThrow();
    expect(() => changeTriggerSchema.parse("NEW_RECORD")).toThrow();
  });

  it("healthContextStatusSchema = confirmed/unconfirmed（§20）", () => {
    for (const v of ["confirmed", "unconfirmed"]) {
      expect(healthContextStatusSchema.parse(v)).toBe(v);
    }
    expect(() => healthContextStatusSchema.parse("pending")).toThrow();
  });

  it("healthContextCategorySchema 接受 5 类（§19 Yourself 结构）", () => {
    for (const v of [
      "symptoms",
      "medications_treatments",
      "related_health_changes",
      "current_health_state",
      "goals_concerns",
    ]) {
      expect(healthContextCategorySchema.parse(v)).toBe(v);
    }
    expect(() => healthContextCategorySchema.parse("symptom")).toThrow();
  });

  it("synthesisProvenanceSchema 接受 4 值（含 degraded + initial sentinel）", () => {
    for (const v of [
      "template",
      "template+llm_trigger",
      "template+llm_trigger_degraded",
      "initial",
    ]) {
      expect(synthesisProvenanceSchema.parse(v)).toBe(v);
    }
    expect(() => synthesisProvenanceSchema.parse("llm")).toThrow();
  });
});

describe("task-44 observe/learn 枚举 + 守卫", () => {
  it("decisionEntryKindSchema accepts learning", () => {
    expect(decisionEntryKindSchema.parse("learning")).toBe("learning");
    expect(decisionEntryKindSchema.parse("observation")).toBe("observation");
    expect(decisionEntryKindSchema.parse("archived_outcome")).toBe(
      "archived_outcome",
    );
    expect(decisionEntryKindSchema.safeParse("unknown").success).toBe(false);
  });

  it("observationDirectionSchema has 4 values (better/same/worse/not_sure)", () => {
    for (const v of ["better", "same", "worse", "not_sure"]) {
      expect(observationDirectionSchema.parse(v)).toBe(v);
    }
    expect(() => observationDirectionSchema.parse("improving")).toThrow();
    expect(() => observationDirectionSchema.parse("BETTER")).toThrow();
  });

  it("checkInFrequencySchema has 5 values + CHECK_IN_FREQ_MS map", () => {
    for (const v of ["daily", "3days", "weekly", "2weeks", "monthly"]) {
      expect(checkInFrequencySchema.parse(v)).toBe(v);
    }
    expect(() => checkInFrequencySchema.parse("biweekly")).toThrow();
    expect(CHECK_IN_FREQ_MS.daily).toBe(24 * 60 * 60 * 1000);
    expect(CHECK_IN_FREQ_MS["3days"]).toBe(3 * 24 * 60 * 60 * 1000);
    expect(CHECK_IN_FREQ_MS.weekly).toBe(7 * 24 * 60 * 60 * 1000);
    expect(CHECK_IN_FREQ_MS["2weeks"]).toBe(14 * 24 * 60 * 60 * 1000);
    expect(CHECK_IN_FREQ_MS.monthly).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("assertCanStartObserving only allows DECIDED", () => {
    expect(() => assertCanStartObserving("DECIDED")).not.toThrow();
    expect(() => assertCanStartObserving("CLOSED")).toThrow();
    expect(() => assertCanStartObserving("ACTIVE")).toThrow();
    expect(() => assertCanStartObserving("OBSERVING")).toThrow();
    expect(() => assertCanStartObserving("LEARNING")).toThrow();
    expect(() => assertCanStartObserving("COMPLETED")).toThrow();
  });

  it("assertCanStopObserving only allows OBSERVING", () => {
    expect(() => assertCanStopObserving("OBSERVING")).not.toThrow();
    expect(() => assertCanStopObserving("DECIDED")).toThrow();
    expect(() => assertCanStopObserving("ACTIVE")).toThrow();
    expect(() => assertCanStopObserving("LEARNING")).toThrow();
    expect(() => assertCanStopObserving("COMPLETED")).toThrow();
    expect(() => assertCanStopObserving("CLOSED")).toThrow();
  });

  it("assertCanMarkCompleted only allows DECIDED", () => {
    expect(() => assertCanMarkCompleted("DECIDED")).not.toThrow();
    expect(() => assertCanMarkCompleted("ACTIVE")).toThrow();
    expect(() => assertCanMarkCompleted("OBSERVING")).toThrow();
    expect(() => assertCanMarkCompleted("LEARNING")).toThrow();
    expect(() => assertCanMarkCompleted("COMPLETED")).toThrow();
    expect(() => assertCanMarkCompleted("CLOSED")).toThrow();
  });

  it("assertCanCompleteAfterLearning only allows LEARNING", () => {
    expect(() => assertCanCompleteAfterLearning("LEARNING")).not.toThrow();
    expect(() => assertCanCompleteAfterLearning("DECIDED")).toThrow();
    expect(() => assertCanCompleteAfterLearning("OBSERVING")).toThrow();
    expect(() => assertCanCompleteAfterLearning("COMPLETED")).toThrow();
    expect(() => assertCanCompleteAfterLearning("CLOSED")).toThrow();
    expect(() => assertCanCompleteAfterLearning("ACTIVE")).toThrow();
  });
});

describe("P2 / P3（B 端）枚举 - 有效值通过", () => {
  it("journeySourceTypeSchema 接受 4 值", () => {
    for (const v of [
      "founder_interview",
      "verified_member",
      "partner_clinic",
      "research_study",
    ]) {
      expect(journeySourceTypeSchema.parse(v)).toBe(v);
    }
  });

  it("followUpStatusSchema = open/done/dismissed", () => {
    for (const v of ["open", "done", "dismissed"]) {
      expect(followUpStatusSchema.parse(v)).toBe(v);
    }
  });

  it("clinicPlanTierSchema = basic/full", () => {
    for (const v of ["basic", "full"]) {
      expect(clinicPlanTierSchema.parse(v)).toBe(v);
    }
  });

  it("authorizationStatusSchema = active/revoked", () => {
    for (const v of ["active", "revoked"]) {
      expect(authorizationStatusSchema.parse(v)).toBe(v);
    }
  });

  it("authorizationActionSchema 接受 4 值", () => {
    for (const v of ["granted", "revoked", "scope_changed", "accessed"]) {
      expect(authorizationActionSchema.parse(v)).toBe(v);
    }
  });

  it("appointmentStatusSchema 接受 5 值", () => {
    for (const v of [
      "scheduled",
      "done",
      "report_review",
      "consultation",
      "canceled",
    ]) {
      expect(appointmentStatusSchema.parse(v)).toBe(v);
    }
  });

  it("reviewStatusSchema = ai_drafted/in_review/approved/sent", () => {
    for (const v of ["ai_drafted", "in_review", "approved", "sent"]) {
      expect(reviewStatusSchema.parse(v)).toBe(v);
    }
  });

  it("referralStatusSchema 接受 4 值", () => {
    for (const v of ["pending", "accepted", "declined", "completed"]) {
      expect(referralStatusSchema.parse(v)).toBe(v);
    }
  });

  it("invoiceStatusSchema = draft/sent/paid/void", () => {
    for (const v of ["draft", "sent", "paid", "void"]) {
      expect(invoiceStatusSchema.parse(v)).toBe(v);
    }
  });
});

describe("enum schemas - 无效值抛错", () => {
  const invalidCases: Array<[string, unknown, string]> = [
    ["authProviderSchema", "apple", "auth_provider"],
    ["userRoleSchema", "superuser", "role"],
    ["subscriptionTierSchema", "premium", "tier（研究档已裁）"],
    ["userStatusSchema", "banned", "status"],
    ["hormonalStatusSchema", "postmenopausal", "hormonal_status"],
    ["wearableProviderSchema", "fitbit", "provider"],
    ["connectionStatusSchema", "expired", "status"],
    ["dataQualitySchema", "bad", "data_quality"],
    ["trendSchema", "worsening", "trend"],
    ["timelineKindSchema", "misc", "kind"],
    ["signalConfidenceSchema", "unknown", "confidence"],
    ["signalTrendSchema", "sideways", "trend"],
    ["decisionLifecycleSchema", "active", "lifecycle（大写）"],
    ["decisionKindSchema", "typeA", "decision_kind"],
    ["decisionTypeSchema", "surgery", "type"],
    ["topicSlugSchema", "surgery", "topic_slug"],
    ["studyRecruitmentStatusSchema", "paused", "recruitment_status"],
    ["studyEnrollmentStatusSchema", "withdrawn", "status"],
    ["consentKeySchema", "public", "key"],
    ["bodyInsightKindSchema", "trend", "kind"],
    ["insightAccentSchema", "green", "accent"],
    ["insightToneSchema", "red", "tone"],
    ["experimentStatusSchema", "aborted", "status"],
    ["healthRecordKindSchema", "note", "kind"],
    ["healthRecordKindSchema", "bloodwork", "kind"],
    ["ocrStatusSchema", "failed", "ocr_status"],
    ["healthRecordStatusSchema", "CONFIRM", "status（缩写非法）"],
    ["healthRecordStatusSchema", "DRAFT", "status（缺 EXTRACTED_ 前缀）"],
    ["extractionConfidenceSchema", "high", "confidence（小写非法）"],
    ["extractionConfidenceSchema", "MEDIUM", "confidence"],
    ["documentClassSchema", "lab", "document_class（小写非法）"],
    ["documentClassSchema", "GENETIC", "document_class"],
    ["subscriptionStatusSchema", "expired", "status"],
    ["aiStateSchema", "loading", "ai_state（小写非法）"],
    ["aiStateSchema", "READY_TO_SHOW", "ai_state"],
    ["changeTriggerSchema", "new-record", "change_trigger（连字符非法）"],
    ["changeTriggerSchema", "NEW_RECORD", "change_trigger（大写非法）"],
    ["healthContextStatusSchema", "pending", "health_context_status"],
    [
      "healthContextCategorySchema",
      "symptom",
      "health_context_category（单数非法）",
    ],
    ["synthesisProvenanceSchema", "llm", "provenance"],
    ["journeySourceTypeSchema", "blog", "source_type"],
    ["followUpStatusSchema", "closed", "status"],
    ["clinicPlanTierSchema", "premium", "plan_tier"],
    ["authorizationStatusSchema", "pending", "status"],
    ["authorizationActionSchema", "viewed", "action"],
    ["appointmentStatusSchema", "no_show", "status"],
    ["reviewStatusSchema", "draft", "status"],
    ["referralStatusSchema", "rejected", "status"],
    ["invoiceStatusSchema", "overdue", "status"],
    ["decisionEntryKindSchema", "unknown", "kind（task-44 learning 之外的值非法）"],
    ["observationDirectionSchema", "improving", "direction（task-44 4 值之外非法）"],
    ["checkInFrequencySchema", "biweekly", "freq（task-44 5 值之外非法）"],
  ];

  const schemaMap: Record<string, import("zod").ZodTypeAny> = {
    authProviderSchema,
    userRoleSchema,
    subscriptionTierSchema,
    userStatusSchema,
    hormonalStatusSchema,
    wearableProviderSchema,
    connectionStatusSchema,
    dataQualitySchema,
    trendSchema,
    timelineKindSchema,
    signalConfidenceSchema,
    signalTrendSchema,
    decisionLifecycleSchema,
    decisionKindSchema,
    decisionTypeSchema,
    topicSlugSchema,
    studyRecruitmentStatusSchema,
    studyEnrollmentStatusSchema,
    consentKeySchema,
    bodyInsightKindSchema,
    insightAccentSchema,
    insightToneSchema,
    experimentStatusSchema,
    healthRecordKindSchema,
    ocrStatusSchema,
    healthRecordStatusSchema,
    extractionConfidenceSchema,
    documentClassSchema,
    subscriptionStatusSchema,
    aiStateSchema,
    changeTriggerSchema,
    healthContextStatusSchema,
    healthContextCategorySchema,
    synthesisProvenanceSchema,
    journeySourceTypeSchema,
    followUpStatusSchema,
    clinicPlanTierSchema,
    authorizationStatusSchema,
    authorizationActionSchema,
    appointmentStatusSchema,
    reviewStatusSchema,
    referralStatusSchema,
    invoiceStatusSchema,
    decisionEntryKindSchema,
    observationDirectionSchema,
    checkInFrequencySchema,
  };

  for (const [schemaName, invalidValue, field] of invalidCases) {
    it(`${schemaName} 拒绝 ${JSON.stringify(invalidValue)}（${field}）`, () => {
      expect(() => schemaMap[schemaName].parse(invalidValue)).toThrow();
    });
  }
});
