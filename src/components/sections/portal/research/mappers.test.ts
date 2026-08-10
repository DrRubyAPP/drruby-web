import { describe, expect, it } from "vitest";
import type { StudyDto, StudyStatus } from "./dto";
import {
  canWithdraw,
  groupStudies,
  hasArm,
  isJoinable,
  STUDY_STATUS_TO_LABEL,
  statusToLabel,
} from "./mappers";

const study = (overrides: Partial<StudyDto> = {}): StudyDto => ({
  id: "s1",
  name: "Perimenopause Sleep Study",
  status: "invited",
  consentGiven: false,
  ...overrides,
});

describe("STUDY_STATUS_TO_LABEL / statusToLabel", () => {
  it("maps all 3 statuses", () => {
    expect(STUDY_STATUS_TO_LABEL.invited).toBe("Invited");
    expect(STUDY_STATUS_TO_LABEL.enrolled).toBe("Enrolled");
    expect(STUDY_STATUS_TO_LABEL.completed).toBe("Completed");
  });

  it("statusToLabel returns label for each status", () => {
    const cases: Array<[StudyStatus, string]> = [
      ["invited", "Invited"],
      ["enrolled", "Enrolled"],
      ["completed", "Completed"],
    ];
    for (const [s, label] of cases) {
      expect(statusToLabel(s)).toBe(label);
    }
  });
});

describe("groupStudies", () => {
  it("empty array → { open: [], yours: [] }", () => {
    expect(groupStudies([])).toEqual({ open: [], yours: [] });
  });

  it("all invited → open full, yours empty", () => {
    const items = [study({ id: "s1" }), study({ id: "s2" })];
    const groups = groupStudies(items);
    expect(groups.open).toHaveLength(2);
    expect(groups.yours).toHaveLength(0);
  });

  it("all enrolled/completed → yours full, open empty", () => {
    const items = [
      study({ id: "s1", status: "enrolled", consentGiven: true }),
      study({ id: "s2", status: "completed", consentGiven: true }),
    ];
    const groups = groupStudies(items);
    expect(groups.open).toHaveLength(0);
    expect(groups.yours).toHaveLength(2);
  });

  it("mixed → both groups correct, original order preserved", () => {
    const items = [
      study({ id: "s1", status: "enrolled", consentGiven: true }),
      study({ id: "s2", status: "invited" }),
      study({ id: "s3", status: "completed", consentGiven: true }),
      study({ id: "s4", status: "invited" }),
    ];
    const groups = groupStudies(items);
    expect(groups.open.map((s) => s.id)).toEqual(["s2", "s4"]);
    expect(groups.yours.map((s) => s.id)).toEqual(["s1", "s3"]);
  });
});

describe("isJoinable", () => {
  it("invited → true", () => {
    expect(isJoinable(study({ status: "invited" }))).toBe(true);
  });
  it("enrolled → false", () => {
    expect(isJoinable(study({ status: "enrolled" }))).toBe(false);
  });
  it("completed → false", () => {
    expect(isJoinable(study({ status: "completed" }))).toBe(false);
  });
});

describe("canWithdraw", () => {
  it("invited → false (nothing to withdraw)", () => {
    expect(canWithdraw(study({ status: "invited" }))).toBe(false);
  });
  it("enrolled → true", () => {
    expect(canWithdraw(study({ status: "enrolled" }))).toBe(true);
  });
  it("completed → false (study over)", () => {
    expect(canWithdraw(study({ status: "completed" }))).toBe(false);
  });
});

describe("hasArm", () => {
  it("arm missing → false", () => {
    expect(hasArm(study({ arm: undefined }))).toBe(false);
  });
  it("arm empty string → false", () => {
    expect(hasArm(study({ arm: "" }))).toBe(false);
  });
  it("arm whitespace-only → false (trim)", () => {
    expect(hasArm(study({ arm: "  \t " }))).toBe(false);
  });
  it("arm non-empty → true", () => {
    expect(hasArm(study({ arm: "intervention-A" }))).toBe(true);
  });
});
