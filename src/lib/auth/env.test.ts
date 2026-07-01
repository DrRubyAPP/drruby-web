import { describe, expect, it, vi } from "vitest";
import { getAuthEnv } from "@/lib/auth/env";

// getAuthEnv now delegates to the unified serverEnv(); env validation itself is
// covered by src/config/env.test.ts. Here we only assert the auth mapping.
vi.mock("@/config/env", () => ({
  serverEnv: () => ({
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    BETTER_AUTH_SECRET: "secret",
    BETTER_AUTH_URL: "http://localhost:3000",
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
    RESEND_API_KEY: "resend-key",
    EMAIL_FROM: "onboarding@resend.dev",
    MAILCHIMP_API_KEY: "mc-key",
    MAILCHIMP_SERVER_PREFIX: "us1",
    MAILCHIMP_AUDIENCE_ID: "aud-id",
    LOG_LEVEL: "info",
  }),
}));

describe("getAuthEnv", () => {
  it("maps the six auth-related vars from serverEnv", () => {
    expect(getAuthEnv()).toEqual({
      BETTER_AUTH_SECRET: "secret",
      BETTER_AUTH_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      RESEND_API_KEY: "resend-key",
      EMAIL_FROM: "onboarding@resend.dev",
    });
  });
});
