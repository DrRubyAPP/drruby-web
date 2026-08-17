import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { crmActivityRepo } from "@/lib/db";
import type { CrmActivityStatus } from "@/lib/db/enums";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  CreateCrmActivityBody,
  CrmActivityDTO,
  CrmActivityListResponse,
  toCrmActivityDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic CRM activities
 * @description 按 clinicId 过滤 + 分页；支持 patientUserId / status 筛选
 * @response CrmActivityListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await crmActivityRepo.listByClinic(clinicId, pp, {
    patientUserId: sp.get("patientUserId") || undefined,
    status: (sp.get("status") as never) || undefined,
  });
  const names = await patientNameMap(res.items.map((a) => a.patientUserId));
  const dto = res.items.map((a) =>
    toCrmActivityDTO(a, names.get(a.patientUserId) ?? null),
  );
  return NextResponse.json(
    CrmActivityListResponse.parse({ ...res, items: dto }),
  );
});

/**
 * Create CRM activity
 * @description 诊所建跟进/活动（clinicId 来自会话，不允许客户端覆盖）；默认 status=open
 * @body CreateCrmActivityBody
 * @response CrmActivityDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateCrmActivityBody.parse(await req.json());
  const row = await crmActivityRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    staffUserId: body.staffUserId,
    type: body.type,
    note: body.note,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
    status: body.status,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toCrmActivityDTO(row, names.get(row.patientUserId) ?? null),
  );
});
