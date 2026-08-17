import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { referralRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import type { ReferralStatus } from "@/lib/db/enums";
import { ReferralDTO, toReferralDTO, UpdateReferralBody } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/** 转介状态机：pending → accepted | declined | completed（逆向/跳步均 422）。 */
const REFERRAL_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  pending: ["accepted", "declined", "completed"],
  accepted: ["completed"],
  declined: [],
  completed: [],
};

/**
 * Get referral detail
 * @description 单条转介；归属不匹配按 404
 * @pathParams { id: string }
 * @response ReferralDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await referralRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  return NextResponse.json(toReferralDTO(row));
});

/**
 * Update referral
 * @description 推进状态机（pending→accepted|declined|completed）；accepted/completed 可写 commissionAmount；非法跃迁 422
 * @pathParams { id: string }
 * @body UpdateReferralBody
 * @response ReferralDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await referralRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateReferralBody.parse(await req.json());
  if (
    !REFERRAL_TRANSITIONS[existing.status as ReferralStatus].includes(
      body.status,
    )
  ) {
    throw new AppError(
      "validation_error",
      `非法状态跃迁 ${existing.status} → ${body.status}`,
      422,
    );
  }
  const row = await referralRepo.update(id, {
    status: body.status,
    commissionAmount: body.commissionAmount,
  });
  return NextResponse.json(toReferralDTO(row));
});
