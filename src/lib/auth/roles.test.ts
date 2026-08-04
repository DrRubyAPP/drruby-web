import { describe, expect, it } from "vitest";
import { homeHrefForRole, homeNavKeyForRole } from "@/lib/auth/roles";

describe("homeHrefForRole", () => {
  it("clinic → /clinic", () => {
    expect(homeHrefForRole("clinic")).toBe("/clinic");
  });

  it("collaborator → /collaborate/workspace", () => {
    expect(homeHrefForRole("collaborator")).toBe("/collaborate/workspace");
  });

  it("user → /portal", () => {
    expect(homeHrefForRole("user")).toBe("/portal");
  });

  it("空/未知 role → /portal（兜底）", () => {
    expect(homeHrefForRole(null)).toBe("/portal");
    expect(homeHrefForRole(undefined)).toBe("/portal");
    expect(homeHrefForRole("unknown")).toBe("/portal");
  });
});

describe("homeNavKeyForRole", () => {
  it("三 role 映射到对应 nav i18n key", () => {
    expect(homeNavKeyForRole("clinic")).toBe("clinic");
    expect(homeNavKeyForRole("collaborator")).toBe("collaborate");
    expect(homeNavKeyForRole("user")).toBe("portal");
  });

  it("空/未知 role → portal（兜底）", () => {
    expect(homeNavKeyForRole(null)).toBe("portal");
    expect(homeNavKeyForRole("unknown")).toBe("portal");
  });
});
