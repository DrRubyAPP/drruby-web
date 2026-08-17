import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { crmActivityRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  CrmActivityDTO,
  toCrmActivityDTO,
  UpdateCrmActivityBody,
} from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get CRM activity detail
 * @description 单条 CRM 活动；归属不匹配按 404
 * @pathParams { id: string }
 * @response CrmActivityDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await crmActivityRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toCrmActivityDTO(row, names.get(row.patientUserId) ?? null),
  );
});

/**
 * Update CRM activity
 * @description 改状态 / 备注 / 到期时间
 * @pathParams { id: string }
 * @body UpdateCrmActivityBody
 * @response CrmActivityDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await crmActivityRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateCrmActivityBody.parse(await req.json());
  const row = await crmActivityRepo.update(id, {
    status: body.status,
    note: body.note,
    dueAt: body.dueAt
      ? new Date(body.dueAt)
      : body.dueAt === null
        ? null
        : undefined,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toCrmActivityDTO(row, names.get(row.patientUserId) ?? null),
  );
});
