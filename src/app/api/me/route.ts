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

/** 更新 profile 入参（email 变更走 better-auth 验证流程，本轮仅 name） */
export const UpdateMeBody = z.object({
  name: z.string().min(1).describe("显示名"),
});

/** 软删脱敏结果 */
export const DeleteMeResponse = z.object({
  deleted: z.literal(true),
});

function toMeDTO(account: {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  role: string;
  subscriptionTier: string;
}): z.infer<typeof MeResponse> {
  return {
    id: account.id,
    name: account.name ?? "",
    email: account.email,
    memberSince: account.createdAt.toISOString(),
    role: userRoleSchema.parse(account.role),
    subscriptionTier: subscriptionTierSchema.parse(account.subscriptionTier),
  };
}

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
  return NextResponse.json(MeResponse.parse(toMeDTO(account)));
});

/**
 * Update current user
 * @description 更新当前用户 profile（本轮仅 name）
 * @body UpdateMeBody
 * @response MeResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = UpdateMeBody.parse(await req.json());
  const account = await userAccountRepo.updateProfile(user.id, {
    name: body.name,
  });
  return NextResponse.json(MeResponse.parse(toMeDTO(account)));
});

