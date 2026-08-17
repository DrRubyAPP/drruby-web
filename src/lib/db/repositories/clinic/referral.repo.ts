import { Prisma } from "~prisma/client";
import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { ReferralStatus } from "@/lib/db/enums";
import { referralStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Referral } from "~prisma/client";

export interface ListReferralFilter {
  status?: ReferralStatus;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListReferralFilter = {},
): Promise<PageResult<Referral>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    referralStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  return paginate<Referral>(
    prisma.referral,
    {
      where,
      orderBy: { createdAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<Referral | null> {
  return prisma.referral.findUnique({ where: { id } });
}

export interface UpdateReferralInput {
  status?: ReferralStatus;
  commissionAmount?: number | string | null;
}

export async function update(
  id: string,
  patch: UpdateReferralInput,
): Promise<Referral> {
  if (patch.status) referralStatusSchema.parse(patch.status);
  return prisma.referral.update({
    where: { id },
    data: {
      status: patch.status,
      commissionAmount:
        patch.commissionAmount === undefined
          ? undefined
          : patch.commissionAmount === null
            ? null
            : new Prisma.Decimal(patch.commissionAmount),
    },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
