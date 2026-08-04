import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/config/env";

const VALID = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  BETTER_AUTH_SECRET: "super-secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
  RESEND_API_KEY: "resend-key",
  EMAIL_FROM: "onboarding@resend.dev",
  MAILCHIMP_API_KEY: "mc-key",
  MAILCHIMP_SERVER_PREFIX: "us1",
  MAILCHIMP_AUDIENCE_ID: "aud-id",
  OPENAI_API_KEY: "sk-test",
} as const;

describe("parseServerEnv", () => {
  it("returns a typed object when all variables are valid", () => {
    const env = parseServerEnv({ ...VALID });
    expect(env.BETTER_AUTH_SECRET).toBe("super-secret");
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    // Defaults kick in for optional vars.
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.NODE_ENV).toBe("test");
    // OpenAI defaults kick in when only the key is provided.
    expect(env.OPENAI_API_KEY).toBe("sk-test");
    expect(env.OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(env.OPENAI_BASE_URL).toBe("https://api.openai.com/v1");
  });

  it("throws naming the missing variable", () => {
    const { BETTER_AUTH_SECRET: _omit, ...rest } = VALID;
    expect(() => parseServerEnv(rest)).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("throws on an invalid EMAIL_FROM", () => {
    expect(() =>
      parseServerEnv({ ...VALID, EMAIL_FROM: "not-an-email" }),
    ).toThrow(/EMAIL_FROM/);
  });

  it("throws on an invalid DATABASE_URL", () => {
    expect(() =>
      parseServerEnv({ ...VALID, DATABASE_URL: "not-a-url" }),
    ).toThrow(/DATABASE_URL/);
  });

  it("throws naming the missing OPENAI_API_KEY", () => {
    const { OPENAI_API_KEY: _omit, ...rest } = VALID;
    expect(() => parseServerEnv(rest)).toThrow(/OPENAI_API_KEY/);
  });

  it("throws on an invalid OPENAI_BASE_URL", () => {
    expect(() =>
      parseServerEnv({ ...VALID, OPENAI_BASE_URL: "not-a-url" }),
    ).toThrow(/OPENAI_BASE_URL/);
  });
});
