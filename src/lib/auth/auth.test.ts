import { beforeAll, describe, expect, it } from "vitest";

// auth.ts reads required env at module load (getAuthEnv) and constructs the
// Better Auth instance; set dummy values so the pure helpers can be imported.
beforeAll(() => {
  process.env.BETTER_AUTH_SECRET ||= "test-secret";
  process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
  process.env.GOOGLE_CLIENT_ID ||= "test-google-id";
  process.env.GOOGLE_CLIENT_SECRET ||= "test-google-secret";
  process.env.RESEND_API_KEY ||= "test-resend-key";
  process.env.EMAIL_FROM ||= "onboarding@resend.dev";
});

describe("withUserDefaults", () => {
  it("injects business defaults for a new user", async () => {
    const { withUserDefaults } = await import("@/lib/auth/auth");
    const out = withUserDefaults({ email: "jane@example.com" });
    expect(out).toMatchObject({
      email: "jane@example.com",
      role: "user",
      authProvider: "email",
    });
  });

  it("preserves existing fields", async () => {
    const { withUserDefaults } = await import("@/lib/auth/auth");
    const out = withUserDefaults({ email: "a@b.com", name: "A" });
    expect(out.name).toBe("A");
    expect(out.email).toBe("a@b.com");
  });
});

describe("googleSyncPatch", () => {
  it("maps a google account to authProvider + googleSub", async () => {
    const { googleSyncPatch } = await import("@/lib/auth/auth");
    expect(
      googleSyncPatch({ providerId: "google", accountId: "sub-123" }),
    ).toEqual({ authProvider: "google", googleSub: "sub-123" });
  });

  it("returns null for non-google providers", async () => {
    const { googleSyncPatch } = await import("@/lib/auth/auth");
    expect(
      googleSyncPatch({ providerId: "credential", accountId: "x" }),
    ).toBeNull();
  });
});
