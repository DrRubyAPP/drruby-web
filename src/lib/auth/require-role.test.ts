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

// 用可变 holder 控制 `headers()` 返回值，驱动 requireRole 的登录/角色分支。
let currentHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: async () => currentHeaders,
}));

/**
 * 走真实 emailOTP 登录流程，返回 cookie 头与 userId，供角色守卫测试复用。
 */
async function signIn(email: string): Promise<{
  cookieHeader: string;
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

  const cookieHeader = (res.headers.get("set-cookie") ?? "").split(";")[0];
  const user = await prisma.userAccount.findFirstOrThrow({ where: { email } });
  return { cookieHeader, userId: user.id };
}

describe("requireRole", () => {
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

  it("命中：role ∈ roles 时放行并返回 user", async () => {
    const { requireRole } = await import("@/lib/auth/session");
    // 新用户默认 role=user
    const { cookieHeader, userId } = await signIn("role-user@example.com");

    currentHeaders = new Headers({ cookie: cookieHeader });
    const user = await requireRole("user", "clinic");
    expect(user.id).toBe(userId);
    expect((user as { role?: string }).role).toBe("user");
  });

  it("未命中：role ∉ roles 时抛 403 FORBIDDEN", async () => {
    const { requireRole } = await import("@/lib/auth/session");
    const { cookieHeader } = await signIn("role-mismatch@example.com");

    currentHeaders = new Headers({ cookie: cookieHeader });
    // 默认 role=user，要求 clinic/collaborator → 403
    await expect(requireRole("clinic", "collaborator")).rejects.toMatchObject({
      name: "AppError",
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("已提升角色：DB 改 role=clinic 后 requireRole('clinic') 放行", async () => {
    const { requireRole } = await import("@/lib/auth/session");
    const { prisma } = await import("@/lib/db/prisma");
    const { cookieHeader, userId } = await signIn("role-clinic@example.com");
    await prisma.userAccount.update({
      where: { id: userId },
      data: { role: "clinic" },
    });

    currentHeaders = new Headers({ cookie: cookieHeader });
    const user = await requireRole("clinic");
    expect(user.id).toBe(userId);
  });

  it("未登录：抛 401 UNAUTHORIZED（先于角色判定）", async () => {
    const { requireRole } = await import("@/lib/auth/session");
    currentHeaders = new Headers(); // 无 cookie / 无 Authorization

    await expect(requireRole("user")).rejects.toMatchObject({
      name: "AppError",
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});
