import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { referralRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { ReferralDTO, ReferralListResponse, toReferralDTO } from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic referrals
 * @description 按 clinicId 过滤 + 分页；支持 status 筛选（仅读取，无创建端点）
 * @response ReferralListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await referralRepo.listByClinic(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
  });
  const dto = res.items.map(toReferralDTO);
  return NextResponse.json(ReferralListResponse.parse({ ...res, items: dto }));
});
