import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { userAccountRepo } from "@/lib/db";
import { userRoleSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { toAdminUserDTO } from "../route";

/** 编辑用户入参：name/role/status 任一可选。status 不暴露 deleted（软删走独立流程）。 */
export const PatchUserBody = z.object({
  name: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get user detail (admin)
 * @description 管理后台用户详情。仅 admin 角色可访问；已软删用户返回 404。
 * @response AdminUserDTO
 * @auth bearer admin
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  await requireRole("admin");
  const { id } = await ctx.params;
  const row = await userAccountRepo.findById(id);
  if (!row || row.deletedAt) {
    throw new AppError("NOT_FOUND", "用户不存在", 404);
  }
  return NextResponse.json(toAdminUserDTO(row));
});

/**
 * Patch user (admin)
 * @description 改他人 name/role/status；改自己 → 403；已软删 → 404；非法 body → 400。
 * @body PatchUserBody
 * @response AdminUserDTO
 * @auth bearer admin
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireRole("admin");
  const { id } = await ctx.params;
  // 不可改自己：admin 不能改自己的 role/status（避免提权/降权自己）
  if (id === user.id) {
    throw new AppError("FORBIDDEN", "不能修改自己的角色", 403);
  }
  const body = PatchUserBody.parse(await req.json());
  const existing = await userAccountRepo.findById(id);
  if (!existing || existing.deletedAt) {
    throw new AppError("NOT_FOUND", "用户不存在", 404);
  }
  const updated = await userAccountRepo.update(id, body);
  return NextResponse.json(toAdminUserDTO(updated));
});
