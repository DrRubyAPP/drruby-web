import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the resend SDK before importing the module under test.
const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const ENV_KEYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;
const saved: Record<string, string | undefined> = {};

describe("sendOtpEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      process.env[k] = k === "EMAIL_FROM" ? "onboarding@resend.dev" : `v-${k}`;
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("sends with correct from/to/subject and includes the otp", async () => {
    sendMock.mockResolvedValue({ data: { id: "x" }, error: null });
    const { sendOtpEmail } = await import("@/lib/auth/email");

    await sendOtpEmail("jane@example.com", "123456");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0][0];
    expect(arg.from).toBe("onboarding@resend.dev");
    expect(arg.to).toBe("jane@example.com");
    expect(arg.subject).toContain("DrRuby");
    expect(arg.html).toContain("123456");
  });

  it("throws a readable error when resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "rate limited" } });
    const { sendOtpEmail } = await import("@/lib/auth/email");

    await expect(sendOtpEmail("jane@example.com", "123456")).rejects.toThrow(
      /rate limited/,
    );
  });
});
