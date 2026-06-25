import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { getAuthEnv } from "@/lib/auth/env";
import { sendOtpEmail } from "@/lib/auth/email";
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
      role: { type: "string", required: true, defaultValue: "user", input: false },
      authProvider: {
        type: "string",
        required: true,
        defaultValue: "email",
        input: false,
      },
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
        await sendOtpEmail(email, otp);
      },
    }),
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
