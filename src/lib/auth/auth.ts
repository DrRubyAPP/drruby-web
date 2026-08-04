import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendOtpEmail } from "@/lib/auth/email";
import { getAuthEnv } from "@/lib/auth/env";
import { prisma } from "@/lib/db/prisma";

/**
 * 创建用户时补齐项目业务必填字段。
 *
 * `UserAccount.role` / `authProvider` 无数据库默认值，Better Auth 仅认识其核心
 * 字段，因此通过此函数（配合 `user.additionalFields` 默认值）保证落库。
 */
export function withUserDefaults<T extends Record<string, unknown>>(data: T) {
  return { ...data, role: "user", authProvider: "email" };
}

/**
 * Google 账号创建后，将其身份信息回写到 UserAccount。
 *
 * 仅对 google provider 生效；其余 provider 返回 null（不修改用户行）。
 */
export function googleSyncPatch(account: {
  providerId: string;
  accountId: string;
}): { authProvider: "google"; googleSub: string } | null {
  return account.providerId === "google"
    ? { authProvider: "google", googleSub: account.accountId }
    : null;
}

const env = getAuthEnv();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // 复用现有 UserAccount 表作为 Better Auth 的 user 模型；声明业务必填字段，
  // 否则 adapter 会在写库前过滤掉未知列，触发 NOT NULL 约束失败。
  user: {
    modelName: "UserAccount",
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },
      authProvider: {
        type: "string",
        required: true,
        defaultValue: "email",
        input: false,
      },
      // 软删标记：暴露到 session.user，供 requireUser 对「已注销但仍持有有效
      // session/token」的用户拒鉴权（task-10 软删脱敏后不应仍能登录）。
      // input:false → 客户端不可写；仅服务端软删流程落库。
      deletedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  // 显式化 session/bearer 生命周期：7 天过期，活跃满 1 天滑动续期（updateAge）。
  // bearer token 与 session 同生命周期，过期后 getSession 返回 null → requireUser
  // 统一 401 语义（RN 端据此触发重登，见 auth-token-contract.md）。
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 1 天滑动续期
  },
  // OTP 按 IP 限流（默认仅生产开启，这里显式打开使各环境语义一致）。命中返回
  // 429（better-auth 内建）。键名对齐 emailOTP 插件真实 endpoint：
  //   发码 /email-otp/send-verification-otp → 3 次 / 分
  //   校验登录 /sign-in/email-otp        → 10 次 / 分
  rateLimit: {
    enabled: true,
    window: 60,
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 10 },
    },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp }) {
        // 开发环境将验证码打印到控制台，免去真实邮件投递即可本地登录。
        if (process.env.NODE_ENV !== "production") {
          console.log(`[auth] OTP for ${email}: ${otp}`);
        }
        await sendOtpEmail(email, otp);
      },
    }),
    // 让同一 getSession 认 `Authorization: Bearer <token>`，供 RN App 直连；
    // 登录响应会附带 `set-auth-token` 头，客户端存下后回传为 bearer。
    bearer(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: withUserDefaults(user) }),
      },
    },
    account: {
      create: {
        after: async (account) => {
          const patch = googleSyncPatch(account);
          if (patch) {
            await prisma.userAccount.update({
              where: { id: account.userId },
              data: patch,
            });
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
