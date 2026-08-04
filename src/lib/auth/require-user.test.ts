import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// auth.ts 在模块加载时读取必需 env（getAuthEnv）并构造 Better Auth 实例。
beforeAll(() => {
  process.env.BETTER_AUTH_SECRET ||= "test-secret";
  process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
  process.env.GOOGLE_CLIENT_ID ||= "test-google-id";
  process.env.GOOGLE_CLIENT_SECRET ||= "test-google-secret";
  process.env.RESEND_API_KEY ||= "test-resend-key";
  process.env.EMAIL_FROM ||= "onboarding@resend.dev";
});

// 免真实邮件投递：OTP 已写入 verification 表，测试直接读表取码。
vi.mock("@/lib/auth/email", () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
}));

// 用可变 holder 控制 `headers()` 返回值，从而驱动 requireUser 的 cookie /
// bearer / 未登录三条路径。
let currentHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: async () => currentHeaders,
}));

/**
 * 走真实 emailOTP 登录流程，返回可复用于两条鉴权通道的凭据：
 * - cookieHeader：`Set-Cookie` 首段（name=value），作请求 `Cookie` 头。
 * - bearerToken：`set-auth-token` 头（bearer 插件返回的已签名 token）。
 */
async function signIn(email: string): Promise<{
  cookieHeader: string;
  bearerToken: string;
  userId: string;
}> {
  const { auth } = await import("@/lib/auth/auth");
  const { prisma } = await import("@/lib/db/prisma");

  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const rec = await prisma.verification.findFirst({
    where: { identifier: { contains: email } },
  });
  const otp = rec?.value?.split(":")[0] ?? "";

  const res = await auth.api.signInEmailOTP({
    body: { email, otp },
    asResponse: true,
  });
  expect(res.status).toBe(200);

  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookieHeader = setCookie.split(";")[0]; // name=value
  const bearerToken = res.headers.get("set-auth-token") ?? "";
  expect(cookieHeader).toContain("session_token=");
  expect(bearerToken).not.toBe("");

  const user = await prisma.userAccount.findFirstOrThrow({ where: { email } });
  return { cookieHeader, bearerToken, userId: user.id };
}

describe("requireUser", () => {
  beforeEach(async () => {
    currentHeaders = new Headers();
    const { resetDatabase } = await import(
      "@/lib/db/repositories/test-helpers"
    );
    await resetDatabase();
  });
  afterEach(async () => {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$disconnect();
  });

  it("未登录抛 401（AppError）", async () => {
    const { requireUser } = await import("@/lib/auth/session");
    currentHeaders = new Headers(); // 无 cookie / 无 Authorization

    await expect(requireUser()).rejects.toMatchObject({
      name: "AppError",
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("cookie session 通道解析出 user", async () => {
    const { requireUser } = await import("@/lib/auth/session");
    const { cookieHeader, userId } = await signIn("cookie-user@example.com");

    currentHeaders = new Headers({ cookie: cookieHeader });
    const user = await requireUser();
    expect(user.id).toBe(userId);
  });

  it("Bearer token 通道解析出同一 user（bearer 插件已挂载）", async () => {
    const { requireUser } = await import("@/lib/auth/session");
    const { bearerToken, userId } = await signIn("bearer-user@example.com");

    currentHeaders = new Headers({ authorization: `Bearer ${bearerToken}` });
    const user = await requireUser();
    expect(user.id).toBe(userId);
  });

  it("cookie 与 Bearer 两条通道指向同一 user", async () => {
    const { requireUser } = await import("@/lib/auth/session");
    const { cookieHeader, bearerToken } = await signIn("both@example.com");

    currentHeaders = new Headers({ cookie: cookieHeader });
    const viaCookie = await requireUser();

    currentHeaders = new Headers({ authorization: `Bearer ${bearerToken}` });
    const viaBearer = await requireUser();

    expect(viaCookie.id).toBe(viaBearer.id);
  });

  it("软删用户即使持有有效 session 也抛 401（deletedAt 拒鉴权）", async () => {
    const { requireUser } = await import("@/lib/auth/session");
    const { prisma } = await import("@/lib/db/prisma");
    const { cookieHeader, userId } = await signIn("deleted@example.com");

    // task-10 软删脱敏后，session/token 仍有效但账号已注销 → 应拒登。
    await prisma.userAccount.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    currentHeaders = new Headers({ cookie: cookieHeader });
    await expect(requireUser()).rejects.toMatchObject({
      name: "AppError",
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});
