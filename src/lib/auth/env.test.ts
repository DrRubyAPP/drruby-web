import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAuthEnv } from "@/lib/auth/env";

const KEYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

describe("getAuthEnv", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      process.env[k] = `value-${k}`;
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns all required vars when present", () => {
    const env = getAuthEnv();
    for (const k of KEYS) {
      expect(env[k]).toBe(`value-${k}`);
    }
  });

  it("throws naming the missing var", () => {
    process.env.RESEND_API_KEY = "";
    expect(() => getAuthEnv()).toThrow(/RESEND_API_KEY/);
  });

  it("throws when a var is undefined", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => getAuthEnv()).toThrow(/GOOGLE_CLIENT_ID/);
  });
});
