import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { skinArchiveRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import { ScanRecordDTO, toScanRecordDTO, UpdateScanRecordBody } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get skin archive scan detail
 * @description 单条扫描记录；归属不匹配按 404
 * @pathParams { id: string }
 * @response ScanRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await skinArchiveRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toScanRecordDTO(row, names.get(row.patientUserId) ?? null),
  );
});

/**
 * Update skin archive scan
 * @description 改趋势（trend）；skin_archive 无 note 列，不支持备注修改
 * @pathParams { id: string }
 * @body UpdateScanRecordBody
 * @response ScanRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await skinArchiveRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateScanRecordBody.parse(await req.json());
  const row = await skinArchiveRepo.update(id, { trend: body.trend });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toScanRecordDTO(row, names.get(row.patientUserId) ?? null),
  );
});
