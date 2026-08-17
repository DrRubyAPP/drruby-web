import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { patientRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { PatientDTO, PatientListResponse } from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic patients (derived, read-only)
 * @description 本诊所患者派生视图：Authorization/Appointment/SkinArchive 关联的 UserAccount + 投影。支持 authStatus/status/q 筛选
 * @response PatientListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await patientRepo.listByClinic(clinicId, pp, {
    authStatus: sp.get("authStatus") ?? undefined,
    status: (sp.get("status") as never) || undefined,
    q: sp.get("q") ?? undefined,
  });
  return NextResponse.json(
    PatientListResponse.parse({
      ...res,
      items: res.items.map((p) => PatientDTO.parse(p)),
    }),
  );
});
