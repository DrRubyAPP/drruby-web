import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { appointmentRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  AppointmentDTO,
  toAppointmentDTO,
  UpdateAppointmentBody,
} from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get appointment detail
 * @description 单条预约；归属不匹配按 404
 * @pathParams { id: string }
 * @response AppointmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await appointmentRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toAppointmentDTO(row, names.get(row.patientUserId) ?? null),
  );
});

/**
 * Update appointment
 * @description 推进状态 / 改备注
 * @pathParams { id: string }
 * @body UpdateAppointmentBody
 * @response AppointmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await appointmentRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateAppointmentBody.parse(await req.json());
  const row = await appointmentRepo.update(id, {
    status: body.status,
    note: body.note,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toAppointmentDTO(row, names.get(row.patientUserId) ?? null),
  );
});
