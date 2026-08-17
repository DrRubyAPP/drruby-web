import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { patientRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { PatientDetailDTO } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get patient detail (derived, read-only)
 * @description 单患者派生视图（含授权 + 最近扫描）；非本诊所患者 → 404
 * @pathParams { id: string }
 * @response PatientDetailDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const detail = await patientRepo.findDetail(clinicId, id);
  if (!detail) throw new AppError("NOT_FOUND", "不存在", 404);
  return NextResponse.json(PatientDetailDTO.parse(detail));
});
