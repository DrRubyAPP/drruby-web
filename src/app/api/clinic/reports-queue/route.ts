import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { clinicReportRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import {
  ClinicReportDTO,
  ClinicReportListResponse,
  CreateClinicReportBody,
  toClinicReportDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic report queue
 * @description 按 clinicId 过滤 + 分页；支持 status 筛选
 * @response ClinicReportListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await clinicReportRepo.listByClinic(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
  });
  const dto = res.items.map(toClinicReportDTO);
  return NextResponse.json(ClinicReportListResponse.parse({ ...res, items: dto }));
});

/**
 * Create AI draft report
 * @description 诊所建 AI 草稿（clinicId 来自会话，不允许客户端覆盖）；默认 status=ai_drafted
 * @body CreateClinicReportBody
 * @response ClinicReportDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateClinicReportBody.parse(await req.json());
  const row = await clinicReportRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    draftContent: body.draftContent,
  });
  return NextResponse.json(toClinicReportDTO(row));
});
