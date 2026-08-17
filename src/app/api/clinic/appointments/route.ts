import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { appointmentRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  AppointmentListResponse,
  CreateAppointmentBody,
  toAppointmentDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic appointments
 * @description 按 clinicId 过滤 + 分页；支持 status / from / to 筛选
 * @response AppointmentListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await appointmentRepo.listByClinic(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
    from: sp.get("from") ? new Date(sp.get("from")!) : undefined,
    to: sp.get("to") ? new Date(sp.get("to")!) : undefined,
  });
  const names = await patientNameMap(res.items.map((a) => a.patientUserId));
  const dto = res.items.map((a) =>
    toAppointmentDTO(a, names.get(a.patientUserId) ?? null),
  );
  return NextResponse.json(
    AppointmentListResponse.parse({ ...res, items: dto }),
  );
});

/**
 * Create appointment
 * @description 诊所建预约（clinicId 来自会话，不允许客户端覆盖）
 * @body CreateAppointmentBody
 * @response AppointmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateAppointmentBody.parse(await req.json());
  const row = await appointmentRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    staffUserId: body.staffUserId,
    referralId: body.referralId,
    scheduledAt: new Date(body.scheduledAt),
    note: body.note,
  });
  return NextResponse.json(toAppointmentDTO(row, null));
});
