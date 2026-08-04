import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { userAccountRepo } from "@/lib/db";
import { subscriptionTierSchema, userRoleSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";

/** 当前用户 profile —— 逐字段对齐 App `types.ts` User，附 role/subscriptionTier 扩展 */
export const MeResponse = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  memberSince: z.string().describe("注册时间 ISO 字符串（← createdAt）"),
  role: userRoleSchema,
  subscriptionTier: subscriptionTierSchema,
});

/**
 * Get current user
 * @description 当前登录用户的账号 profile（getUser）
 * @response MeResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const account = await userAccountRepo.findById(user.id);
  if (!account) throw new AppError("NOT_FOUND", "账号不存在", 404);

  const dto: z.infer<typeof MeResponse> = {
    id: account.id,
    name: account.name ?? "",
    email: account.email,
    memberSince: account.createdAt.toISOString(),
    role: userRoleSchema.parse(account.role),
    subscriptionTier: subscriptionTierSchema.parse(account.subscriptionTier),
  };
  return NextResponse.json(MeResponse.parse(dto));
});
