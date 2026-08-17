import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { AuthorizationStatus } from "@/lib/db/enums";
import { authorizationStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Authorization, AuthorizationAudit } from "~prisma/client";
import { Prisma } from "~prisma/client";

export interface ListComplianceFilter {
  status?: AuthorizationStatus;
}

/** 本诊所授权列表（派生合规视图），按 clinicId 过滤 + 分页。 */
export async function listAuthorizations(
  clinicId: string,
  pp: PageParams,
  filter: ListComplianceFilter = {},
): Promise<PageResult<Authorization>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    authorizationStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  return paginate<Authorization>(
    prisma.authorization,
    {
      where,
      orderBy: { grantedAt: "desc" },
    },
    pp,
  );
}

/** 单条授权（含诊所归属校验）；非本诊所 → null（调用方转 404）。 */
export async function findById(
  clinicId: string,
  id: string,
): Promise<Authorization | null> {
  const row = await prisma.authorization.findUnique({ where: { id } });
  if (!row || row.clinicId !== clinicId) return null;
  return row;
}

export interface ComplianceDetail {
  id: string;
  userId: string;
  clinicId: string;
  scopes: string[];
  status: string;
  grantedAt: Date;
  revokedAt: Date | null;
  audit: AuthorizationAudit[];
}

/** 授权详情 + 其审计流水（按 createdAt asc）。非本诊所 → null。 */
export async function findDetail(
  clinicId: string,
  id: string,
): Promise<ComplianceDetail | null> {
  const row = await findById(clinicId, id);
  if (!row) return null;
  const audit = await prisma.authorizationAudit.findMany({
    where: { authorizationId: id },
    orderBy: { createdAt: "asc" },
  });
  return {
    id: row.id,
    userId: row.userId,
    clinicId: row.clinicId,
    scopes: row.scopes,
    status: row.status,
    grantedAt: row.grantedAt,
    revokedAt: row.revokedAt,
    audit,
  };
}

/**
 * 撤销授权（事务）：
 * - authorization.status → revoked, revokedAt = now
 * - 追加 authorizationAudit(action=revoked, actorUserId)
 */
export async function revoke(
  clinicId: string,
  id: string,
  actorUserId: string,
): Promise<Authorization> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.authorization.update({
      where: { id },
      data: { status: "revoked", revokedAt: new Date() },
    });
    await tx.authorizationAudit.create({
      data: {
        authorizationId: id,
        action: "revoked",
        actorUserId,
      },
    });
    return updated;
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
