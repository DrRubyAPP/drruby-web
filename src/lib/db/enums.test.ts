import { describe, expect, it } from "vitest";
import {
  appointmentStatusSchema,
  assertOutcomeForKind,
  authorizationActionSchema,
  authorizationStatusSchema,
  authProviderSchema,
  bodyInsightKindSchema,
  clinicPlanTierSchema,
  connectionStatusSchema,
  consentKeySchema,
  dataQualitySchema,
  decisionKindSchema,
  decisionLifecycleSchema,
  decisionTypeSchema,
  experimentStatusSchema,
  fitzpatrickScaleSchema,
  followUpStatusSchema,
  healthRecordKindSchema,
  hormonalStatusSchema,
  insightAccentSchema,
  insightToneSchema,
  invoiceStatusSchema,
  journeySourceTypeSchema,
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

  it("healthRecordKindSchema = lab/imaging/checkup/vitals", () => {
    for (const v of ["lab", "imaging", "checkup", "vitals"]) {
      expect(healthRecordKindSchema.parse(v)).toBe(v);
    }
  });

  it("ocrStatusSchema = pending/processing/done/manual", () => {
    for (const v of ["pending", "processing", "done", "manual"]) {
      expect(ocrStatusSchema.parse(v)).toBe(v);
    }
  });

  it("subscriptionStatusSchema = active/canceled/past_due/trialing", () => {
    for (const v of ["active", "canceled", "past_due", "trialing"]) {
      expect(subscriptionStatusSchema.parse(v)).toBe(v);
    }
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
    ["ocrStatusSchema", "failed", "ocr_status"],
    ["subscriptionStatusSchema", "expired", "status"],
    ["journeySourceTypeSchema", "blog", "source_type"],
    ["followUpStatusSchema", "closed", "status"],
    ["clinicPlanTierSchema", "premium", "plan_tier"],
    ["authorizationStatusSchema", "pending", "status"],
    ["authorizationActionSchema", "viewed", "action"],
    ["appointmentStatusSchema", "no_show", "status"],
    ["reviewStatusSchema", "draft", "status"],
    ["referralStatusSchema", "rejected", "status"],
    ["invoiceStatusSchema", "overdue", "status"],
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
    subscriptionStatusSchema,
    journeySourceTypeSchema,
    followUpStatusSchema,
    clinicPlanTierSchema,
    authorizationStatusSchema,
    authorizationActionSchema,
    appointmentStatusSchema,
    reviewStatusSchema,
    referralStatusSchema,
    invoiceStatusSchema,
  };

  for (const [schemaName, invalidValue, field] of invalidCases) {
    it(`${schemaName} 拒绝 ${JSON.stringify(invalidValue)}（${field}）`, () => {
      expect(() => schemaMap[schemaName].parse(invalidValue)).toThrow();
    });
  }
});
