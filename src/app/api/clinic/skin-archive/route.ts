import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { skinArchiveRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import {
  CreateScanRecordBody,
  ScanRecordListResponse,
  toScanRecordDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic skin archive scans
 * @description 按 clinicId 过滤 + 分页；支持 patientUserId / trend 筛选
 * @response ScanRecordListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await skinArchiveRepo.listByClinic(clinicId, pp, {
    patientUserId: sp.get("patientUserId") ?? undefined,
    trend: (sp.get("trend") as never) || undefined,
  });
  const names = await patientNameMap(res.items.map((s) => s.patientUserId));
  const dto = res.items.map((s) =>
    toScanRecordDTO(s, names.get(s.patientUserId) ?? null),
  );
  return NextResponse.json(
    ScanRecordListResponse.parse({ ...res, items: dto }),
  );
});

/**
 * Create skin archive scan
 * @description 诊所上传扫描记录（clinicId 来自会话，不允许客户端覆盖）
 * @body CreateScanRecordBody
 * @response ScanRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateScanRecordBody.parse(await req.json());
  const row = await skinArchiveRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    objectKey: body.objectKey,
    inflammatoryScore: body.inflammatoryScore ?? null,
    pigmentationScore: body.pigmentationScore ?? null,
    textureScore: body.textureScore ?? null,
    trend: body.trend ?? null,
    capturedAt: new Date(body.capturedAt),
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toScanRecordDTO(row, names.get(row.patientUserId) ?? null),
  );
});
