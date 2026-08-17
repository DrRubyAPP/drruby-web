import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { treatmentRepo } from "@/lib/db";
import type { TreatmentStatus } from "@/lib/db/enums";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  CreateTreatmentBody,
  TreatmentDTO,
  TreatmentListResponse,
  toTreatmentDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic treatments
 * @description 按 clinicId 过滤 + 分页；支持 status / patientUserId 筛选
 * @response TreatmentListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await treatmentRepo.listByClinic(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
    patientUserId: sp.get("patientUserId") || undefined,
  });
  const names = await patientNameMap(res.items.map((a) => a.patientUserId));
  const dto = res.items.map((a) =>
    toTreatmentDTO(a, names.get(a.patientUserId) ?? null),
  );
  return NextResponse.json(TreatmentListResponse.parse({ ...res, items: dto }));
});

/**
 * Create treatment
 * @description 诊所建治疗记录（clinicId 来自会话，不允许客户端覆盖）；默认 status=planned
 * @body CreateTreatmentBody
 * @response TreatmentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateTreatmentBody.parse(await req.json());
  const row = await treatmentRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    staffUserId: body.staffUserId,
    name: body.name,
    type: body.type,
    status: body.status,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    amount: body.amount ?? null,
    currency: body.currency,
    note: body.note,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toTreatmentDTO(row, names.get(row.patientUserId) ?? null),
  );
});
