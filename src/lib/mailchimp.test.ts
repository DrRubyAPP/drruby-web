import { describe, expect, it } from "vitest";
import { EMAIL_RE, TAG_MAP } from "@/lib/mailchimp";

describe("EMAIL_RE", () => {
  it("accepts well-formed addresses", () => {
    expect(EMAIL_RE.test("jane@example.com")).toBe(true);
    expect(EMAIL_RE.test("a.b+tag@sub.domain.co")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(EMAIL_RE.test("")).toBe(false);
    expect(EMAIL_RE.test("not-an-email")).toBe(false);
    expect(EMAIL_RE.test("missing@domain")).toBe(false);
    expect(EMAIL_RE.test("spaces in@email.com")).toBe(false);
  });
});

describe("TAG_MAP", () => {
  it("maps each form id to its Mailchimp tag", () => {
    expect(TAG_MAP.home).toBe("home-page");
    expect(TAG_MAP.skin).toBe("skin-page");
    expect(TAG_MAP.healthspan).toBe("healthspan-page");
  });
});
