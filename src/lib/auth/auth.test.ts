import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

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

// 发码测试免真实邮件投递（OTP 已落 verification 表，无需外发）。
vi.mock("@/lib/auth/email", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

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

describe("OTP rateLimit 配置", () => {
  it("customRules 覆盖发码 3/分、校验 10/分（键对齐 emailOTP 真实 endpoint）", async () => {
    const { auth } = await import("@/lib/auth/auth");
    const rl = (
      auth.options as {
        rateLimit?: {
          enabled?: boolean;
          customRules?: Record<string, { window: number; max: number }>;
        };
      }
    ).rateLimit;

    expect(rl?.enabled).toBe(true);
    // 发码：/email-otp/send-verification-otp → 3 次 / 60s
    expect(rl?.customRules?.["/email-otp/send-verification-otp"]).toEqual({
      window: 60,
      max: 3,
    });
    // 校验登录：/sign-in/email-otp → 10 次 / 60s
    expect(rl?.customRules?.["/sign-in/email-otp"]).toEqual({
      window: 60,
      max: 10,
    });
  });
});

describe("session 生命周期配置", () => {
  it("显式落 expiresIn=7天 / updateAge=1天（滑动续期）", async () => {
    const { auth } = await import("@/lib/auth/auth");
    const session = (
      auth.options as {
        session?: { expiresIn?: number; updateAge?: number };
      }
    ).session;

    // bearer token 与 session 同生命周期：7 天过期、活跃满 1 天滑动续期。
    expect(session?.expiresIn).toBe(60 * 60 * 24 * 7);
    expect(session?.updateAge).toBe(60 * 60 * 24);
  });
});

// 限流通过 HTTP handler 生效（auth.api.* 直调不经限流中间件），故走真实
// auth.handler 验证发码第 4 次被拒。用独立 IP 桶避免与其他用例相互污染。
describe("OTP 限流实际生效（发码 3/分 → 第 4 次 429）", () => {
  beforeEach(async () => {
    const { resetDatabase } = await import(
      "@/lib/db/repositories/test-helpers"
    );
    await resetDatabase();
  });
  afterEach(async () => {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$disconnect();
  });

  it("同一 IP 连发 4 次发码：前 3 次放行、第 4 次 429", async () => {
    const { auth } = await import("@/lib/auth/auth");
    const sendReq = () =>
      new Request(
        "http://localhost:3000/api/auth/email-otp/send-verification-otp",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "203.0.113.9",
          },
          body: JSON.stringify({ email: "rl@example.com", type: "sign-in" }),
        },
      );

    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await auth.handler(sendReq());
      statuses.push(res.status);
    }

    // 前 3 次未被限流（非 429），第 4 次命中 429。
    expect(statuses.slice(0, 3).some((s) => s === 429)).toBe(false);
    expect(statuses[3]).toBe(429);
  });
});
