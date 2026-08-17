import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { complianceRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import { ComplianceAuditDTO, ComplianceDetailDTO } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Get authorization detail (compliance)
 * @description 单条授权 + 审计流水；归属不匹配按 404
 * @pathParams { id: string }
 * @response ComplianceDetailDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const detail = await complianceRepo.findDetail(clinicId, id);
  if (!detail) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([detail.userId]);
  return NextResponse.json(
    ComplianceDetailDTO.parse({
      id: detail.id,
      patientUserId: detail.userId,
      patientName: names.get(detail.userId) ?? null,
      scopes: detail.scopes,
      status: detail.status,
      grantedAt: detail.grantedAt.toISOString(),
      revokedAt: detail.revokedAt ? detail.revokedAt.toISOString() : null,
      audit: detail.audit.map((a) =>
        ComplianceAuditDTO.parse({
          id: a.id,
          action: a.action,
          actorUserId: a.actorUserId,
          createdAt: a.createdAt.toISOString(),
        }),
      ),
    }),
  );
});

/**
 * Revoke authorization (compliance)
 * @description 撤销授权（仅此写端点）；已撤销再撤销 → 422；归属不匹配按 404
 * @pathParams { id: string }
 * @response ComplianceDetailDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId, id: actorUserId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await complianceRepo.findById(clinicId, id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  if (existing.status === "revoked") {
    throw new AppError("validation_error", "授权已撤销", 422);
  }
  const updated = await complianceRepo.revoke(clinicId, id, actorUserId);
  const detail = await complianceRepo.findDetail(clinicId, id);
  const names = await patientNameMap([detail!.userId]);
  return NextResponse.json(
    ComplianceDetailDTO.parse({
      id: updated.id,
      patientUserId: updated.userId,
      patientName: names.get(updated.userId) ?? null,
      scopes: updated.scopes,
      status: updated.status,
      grantedAt: updated.grantedAt.toISOString(),
      revokedAt: updated.revokedAt ? updated.revokedAt.toISOString() : null,
      audit: detail!.audit.map((a) =>
        ComplianceAuditDTO.parse({
          id: a.id,
          action: a.action,
          actorUserId: a.actorUserId,
          createdAt: a.createdAt.toISOString(),
        }),
      ),
    }),
  );
});
