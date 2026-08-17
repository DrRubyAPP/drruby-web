import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { ReviewStatus } from "@/lib/db/enums";
import { reviewStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { ClinicReport } from "~prisma/client";

export interface ListClinicReportFilter {
  status?: ReviewStatus;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListClinicReportFilter = {},
): Promise<PageResult<ClinicReport>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    reviewStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  return paginate<ClinicReport>(
    prisma.clinicReport,
    {
      where,
      orderBy: { createdAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<ClinicReport | null> {
  return prisma.clinicReport.findUnique({ where: { id } });
}

export interface CreateClinicReportInput {
  patientUserId: string;
  draftContent: unknown;
}

export async function create(
  clinicId: string,
  input: CreateClinicReportInput,
): Promise<ClinicReport> {
  return prisma.clinicReport.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      draftContent: input.draftContent as object,
      status: "ai_drafted",
    },
  });
}

export interface UpdateClinicReportInput {
  status?: ReviewStatus;
  reviewerUserId?: string | null;
  finalContent?: unknown;
  sentAt?: Date | null;
}

export async function update(
  id: string,
  patch: UpdateClinicReportInput,
): Promise<ClinicReport> {
  if (patch.status) reviewStatusSchema.parse(patch.status);
  return prisma.clinicReport.update({
    where: { id },
    data: {
      status: patch.status,
      reviewerUserId: patch.reviewerUserId,
      finalContent: patch.finalContent as object | undefined,
      sentAt: patch.sentAt,
    },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
