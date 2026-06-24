import { describe, expect, it } from "vitest";
import {
  authProviderSchema,
  captureDeviceSchema,
  captureQualitySchema,
  captureWindowSchema,
  changeTypeSchema,
  confidenceLevelSchema,
  connectionStatusSchema,
  contentTypeSchema,
  dataQualitySchema,
  dermMagnificationSchema,
  expertDomainSchema,
  expertNameSchema,
  faceSideSchema,
  faceSideWithBothSchema,
  fitzpatrickScaleSchema,
  glucoseTrendSchema,
  hormonalStatusSchema,
  insightTypeSchema,
  interventionCategorySchema,
  lightingScoreSchema,
  mcsLevelSchema,
  milestoneTypeSchema,
  sisActionSchema,
  sisStatusSchema,
  skinTypeSchema,
  studySessionStatusSchema,
  subscriptionTierSchema,
  trendSchema,
  userRoleSchema,
  userStatusSchema,
  verdictSchema,
  washoutStatusSchema,
  wearableProviderSchema,
} from "@/lib/db/enums";

describe("enum schemas - 有效值通过", () => {
  it("interventionCategorySchema 接受 11 类", () => {
    for (const v of [
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
    ]) {
      expect(interventionCategorySchema.parse(v)).toBe(v);
    }
  });

  it("faceSideSchema = left/right", () => {
    expect(faceSideSchema.parse("left")).toBe("left");
    expect(faceSideSchema.parse("right")).toBe("right");
  });

  it("faceSideWithBothSchema = left/right/both（仅 intervention_log）", () => {
    expect(faceSideWithBothSchema.parse("both")).toBe("both");
  });

  it("authProviderSchema = email/google", () => {
    expect(authProviderSchema.parse("email")).toBe("email");
    expect(authProviderSchema.parse("google")).toBe("google");
  });

  it("userRoleSchema = user/clinic", () => {
    expect(userRoleSchema.parse("user")).toBe("user");
    expect(userRoleSchema.parse("clinic")).toBe("clinic");
  });

  it("subscriptionTierSchema = free/paid/premium/vip", () => {
    for (const v of ["free", "paid", "premium", "vip"]) {
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

  it("studySessionStatusSchema 接受 5 值", () => {
    for (const v of [
      "pending_first_capture",
      "active",
      "paused",
      "completed",
      "abandoned",
    ]) {
      expect(studySessionStatusSchema.parse(v)).toBe(v);
    }
  });

  it("washoutStatusSchema = not_started/in_progress/completed", () => {
    for (const v of ["not_started", "in_progress", "completed"]) {
      expect(washoutStatusSchema.parse(v)).toBe(v);
    }
  });

  it("captureWindowSchema = morning/midday/evening", () => {
    for (const v of ["morning", "midday", "evening"]) {
      expect(captureWindowSchema.parse(v)).toBe(v);
    }
  });

  it("captureDeviceSchema = phone_front/phone_rear/dermoscope", () => {
    for (const v of ["phone_front", "phone_rear", "dermoscope"]) {
      expect(captureDeviceSchema.parse(v)).toBe(v);
    }
  });

  it("mcsLevelSchema = High/Medium/Low", () => {
    for (const v of ["High", "Medium", "Low"]) {
      expect(mcsLevelSchema.parse(v)).toBe(v);
    }
  });

  it("lightingScoreSchema = pass/fail", () => {
    expect(lightingScoreSchema.parse("pass")).toBe("pass");
    expect(lightingScoreSchema.parse("fail")).toBe("fail");
  });

  it("sisStatusSchema = computed/degraded/skipped", () => {
    for (const v of ["computed", "degraded", "skipped"]) {
      expect(sisStatusSchema.parse(v)).toBe(v);
    }
  });

  it("dataQualitySchema = complete/partial/missing", () => {
    for (const v of ["complete", "partial", "missing"]) {
      expect(dataQualitySchema.parse(v)).toBe(v);
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

  it("trendSchema = improving/stable/declining", () => {
    for (const v of ["improving", "stable", "declining"]) {
      expect(trendSchema.parse(v)).toBe(v);
    }
  });

  it("confidenceLevelSchema = high/medium/low", () => {
    for (const v of ["high", "medium", "low"]) {
      expect(confidenceLevelSchema.parse(v)).toBe(v);
    }
  });

  it("insightTypeSchema 接受 5 值", () => {
    for (const v of [
      "skin_sleep_correlation",
      "sis_drop_explained",
      "lifestyle_skin_link",
      "milestone_approaching",
      "cohort_recommendation",
    ]) {
      expect(insightTypeSchema.parse(v)).toBe(v);
    }
  });

  it("milestoneTypeSchema 接受 6 值", () => {
    for (const v of [
      "first_positive_sis",
      "sustained_?wk",
      "clinic_elastometry_validated",
      "best_sis_ever",
      "sleep_improved",
      "lifestyle_correlated",
    ]) {
      expect(milestoneTypeSchema.parse(v)).toBe(v);
    }
  });

  it("changeTypeSchema 接受 8 值", () => {
    for (const v of [
      "sleep_habit",
      "diet",
      "exercise",
      "stress_mgmt",
      "alcohol",
      "skincare_routine",
      "supplement",
      "medication",
    ]) {
      expect(changeTypeSchema.parse(v)).toBe(v);
    }
  });

  it("sisActionSchema = viewed/changed_product/continued/paused/skipped", () => {
    for (const v of [
      "viewed",
      "changed_product",
      "continued",
      "paused",
      "skipped",
    ]) {
      expect(sisActionSchema.parse(v)).toBe(v);
    }
  });

  it("expertNameSchema = brenner/gunter/skin_specialist", () => {
    for (const v of ["brenner", "gunter", "skin_specialist"]) {
      expect(expertNameSchema.parse(v)).toBe(v);
    }
  });

  it("contentTypeSchema = paper/protocol/guideline/annotation", () => {
    for (const v of ["paper", "protocol", "guideline", "annotation"]) {
      expect(contentTypeSchema.parse(v)).toBe(v);
    }
  });

  it("expertDomainSchema 接受 6 值", () => {
    for (const v of [
      "hormone_skin",
      "barrier_function",
      "glycation",
      "photoaging",
      "elasticity",
      "formulation",
    ]) {
      expect(expertDomainSchema.parse(v)).toBe(v);
    }
  });

  it("verdictSchema = keep/stop/review/caution", () => {
    for (const v of ["keep", "stop", "review", "caution"]) {
      expect(verdictSchema.parse(v)).toBe(v);
    }
  });

  it("glucoseTrendSchema 接受 7 值（Dexcom 对齐）", () => {
    for (const v of [
      "double_up",
      "single_up",
      "forty_five_up",
      "flat",
      "forty_five_down",
      "single_down",
      "double_down",
    ]) {
      expect(glucoseTrendSchema.parse(v)).toBe(v);
    }
  });

  it("dermMagnificationSchema = 10x/20x/50x", () => {
    for (const v of ["10x", "20x", "50x"]) {
      expect(dermMagnificationSchema.parse(v)).toBe(v);
    }
  });

  it("captureQualitySchema = good/fair/poor", () => {
    for (const v of ["good", "fair", "poor"]) {
      expect(captureQualitySchema.parse(v)).toBe(v);
    }
  });

  it("skinTypeSchema / fitzpatrickScaleSchema 当前为占位 string", () => {
    expect(skinTypeSchema.parse("oily")).toBe("oily");
    expect(fitzpatrickScaleSchema.parse("II")).toBe("II");
  });
});

describe("enum schemas - 无效值抛错", () => {
  const invalidCases: Array<[string, unknown, string]> = [
    ["interventionCategorySchema", "unknown_cat", "category"],
    ["faceSideSchema", "center", "face_side"],
    ["faceSideWithBothSchema", "all", "face_side"],
    ["authProviderSchema", "apple", "auth_provider"],
    ["userRoleSchema", "admin", "role"],
    ["subscriptionTierSchema", "ultimate", "tier"],
    ["userStatusSchema", "banned", "status"],
    ["hormonalStatusSchema", "postmenopausal", "hormonal_status"],
    ["studySessionStatusSchema", "running", "status"],
    ["washoutStatusSchema", "done", "washout_status"],
    ["captureWindowSchema", "night", "preferred_capture_window"],
    ["captureDeviceSchema", "dslr", "capture_device"],
    ["mcsLevelSchema", "high", "mcs_level（大小写敏感）"],
    ["lightingScoreSchema", "ok", "lighting_score"],
    ["sisStatusSchema", "failed", "sis status"],
    ["dataQualitySchema", "bad", "data_quality"],
    ["wearableProviderSchema", "fitbit", "provider"],
    ["connectionStatusSchema", "expired", "status"],
    ["trendSchema", "worsening", "trend"],
    ["confidenceLevelSchema", "certain", "confidence"],
    ["insightTypeSchema", "random_insight", "insight_type"],
    [
      "milestoneTypeSchema",
      "sustained_5wk",
      "milestone_type（占位值需待 §27-4 确认）",
    ],
    ["changeTypeSchema", "smoking", "change_type"],
    ["sisActionSchema", "ignored", "action_taken"],
    ["expertNameSchema", "smith", "expert_name"],
    ["contentTypeSchema", "video", "content_type"],
    ["expertDomainSchema", "acne", "domain"],
    ["verdictSchema", "maybe", "verdict"],
    ["glucoseTrendSchema", "slight_up", "trend_arrow"],
    ["dermMagnificationSchema", "5x", "derm_magnification"],
    ["captureQualitySchema", "excellent", "capture_quality"],
  ];

  for (const [schemaName, invalidValue, field] of invalidCases) {
    it(`${schemaName} 拒绝 ${JSON.stringify(invalidValue)}（${field}）`, () => {
      const schemaMap: Record<
        string,
        ReturnType<
          typeof import("@/lib/db/enums")["interventionCategorySchema"]
        >
      > = {
        interventionCategorySchema,
        faceSideSchema,
        faceSideWithBothSchema,
        authProviderSchema,
        userRoleSchema,
        subscriptionTierSchema,
        userStatusSchema,
        hormonalStatusSchema,
        studySessionStatusSchema,
        washoutStatusSchema,
        captureWindowSchema,
        captureDeviceSchema,
        mcsLevelSchema,
        lightingScoreSchema,
        sisStatusSchema,
        dataQualitySchema,
        wearableProviderSchema,
        connectionStatusSchema,
        trendSchema,
        confidenceLevelSchema,
        insightTypeSchema,
        milestoneTypeSchema,
        changeTypeSchema,
        sisActionSchema,
        expertNameSchema,
        contentTypeSchema,
        expertDomainSchema,
        verdictSchema,
        glucoseTrendSchema,
        dermMagnificationSchema,
        captureQualitySchema,
      };
      expect(() => schemaMap[schemaName].parse(invalidValue)).toThrow();
    });
  }
});
