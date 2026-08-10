import { describe, expect, it } from "vitest";
import type { ConsentSettingDto, ContributionDto } from "./dto";
import { canShare, canToggle, canWithdrawContribution, isLocked } from "./mappers";

const consent = (overrides: Partial<ConsentSettingDto> = {}): ConsentSettingDto => ({
  id: "c1",
  title: "Use DrRuby for yourself",
  description: "...",
  value: false,
  ...overrides,
});

const contribution = (overrides: Partial<ContributionDto> = {}): ContributionDto => ({
  id: "k1",
  title: "Cycle insights",
  description: "...",
  shared: false,
  ...overrides,
});

describe("isLocked", () => {
  it("locked true → true", () => {
    expect(isLocked(consent({ locked: true }))).toBe(true);
  });
  it("locked false → false", () => {
    expect(isLocked(consent({ locked: false }))).toBe(false);
  });
  it("locked missing → false (optional field)", () => {
    expect(isLocked(consent({ locked: undefined }))).toBe(false);
  });
});

describe("canToggle", () => {
  it("locked true → false", () => {
    expect(canToggle(consent({ locked: true }))).toBe(false);
  });
  it("locked false → true", () => {
    expect(canToggle(consent({ locked: false }))).toBe(true);
  });
  it("locked missing → true", () => {
    expect(canToggle(consent({ locked: undefined }))).toBe(true);
  });
});

describe("canShare", () => {
  it("shared false → true", () => {
    expect(canShare(contribution({ shared: false }))).toBe(true);
  });
  it("shared true → false", () => {
    expect(canShare(contribution({ shared: true }))).toBe(false);
  });
});

describe("canWithdrawContribution", () => {
  it("shared false → false (nothing to withdraw)", () => {
    expect(canWithdrawContribution(contribution({ shared: false }))).toBe(false);
  });
  it("shared true → true", () => {
    expect(canWithdrawContribution(contribution({ shared: true }))).toBe(true);
  });
});
