import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { complianceRepo } from "@/lib/db";
import type { AuthorizationStatus } from "@/lib/db/enums";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import { ComplianceItemDTO, ComplianceListResponse } from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic authorizations (compliance view)
 * @description 本诊所跨端授权列表（合规视图）；支持 status 筛选
 * @response ComplianceListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await complianceRepo.listAuthorizations(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
  });
  const names = await patientNameMap(res.items.map((a) => a.userId));
  const dto = res.items.map((a) =>
    ComplianceItemDTO.parse({
      id: a.id,
      patientUserId: a.userId,
      patientName: names.get(a.userId) ?? null,
      scopes: a.scopes,
      status: a.status,
      grantedAt: a.grantedAt.toISOString(),
      revokedAt: a.revokedAt ? a.revokedAt.toISOString() : null,
    }),
  );
  return NextResponse.json(
    ComplianceListResponse.parse({ ...res, items: dto }),
  );
});
