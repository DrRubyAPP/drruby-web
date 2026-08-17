import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { treatmentRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import { TreatmentDTO, toTreatmentDTO, UpdateTreatmentBody } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get treatment detail
 * @description 单条治疗记录；归属不匹配按 404
 * @pathParams { id: string }
 * @response TreatmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await treatmentRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toTreatmentDTO(row, names.get(row.patientUserId) ?? null),
  );
});

/**
 * Update treatment
 * @description 改状态 / 改备注
 * @pathParams { id: string }
 * @body UpdateTreatmentBody
 * @response TreatmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await treatmentRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateTreatmentBody.parse(await req.json());
  const row = await treatmentRepo.update(id, {
    status: body.status,
    note: body.note,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toTreatmentDTO(row, names.get(row.patientUserId) ?? null),
  );
});
