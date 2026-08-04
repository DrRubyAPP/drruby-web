import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { consentSettingRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { ConsentSettingDTO } from "../route";

/** 切换隐私开关入参 */
export const UpdateConsentBody = z.object({
  value: z.boolean().describe("目标开关值"),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Toggle consent setting
 * @description 切换某档隐私开关。`self`（locked）档永久开启，尝试关闭 → 409。越权按 404
 * @body UpdateConsentBody
 * @response ConsentSettingDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const setting = await consentSettingRepo.findById(id);
  if (!setting || setting.userId !== user.id) {
    throw new AppError("NOT_FOUND", "隐私设置不存在", 404);
  }
  // self 档永开：locked 拒切（不改库）
  if (setting.locked || setting.key === "self") {
    throw new AppError("CONSENT_LOCKED", "该项永久开启，不可关闭", 409);
  }

  const body = UpdateConsentBody.parse(await req.json());
  const updated = await consentSettingRepo.setValue(id, body.value);
  return NextResponse.json(
    ConsentSettingDTO.parse({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      value: updated.value,
      locked: updated.locked,
    }),
  );
});
