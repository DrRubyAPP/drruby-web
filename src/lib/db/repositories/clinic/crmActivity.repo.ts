import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { CrmActivityStatus, CrmActivityType } from "@/lib/db/enums";
import { crmActivityStatusSchema, crmActivityTypeSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { CrmActivity } from "~prisma/client";

export interface ListCrmFilter {
  patientUserId?: string;
  status?: CrmActivityStatus;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListCrmFilter = {},
): Promise<PageResult<CrmActivity>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    crmActivityStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  if (filter.patientUserId) {
    where.patientUserId = filter.patientUserId;
  }
  return paginate<CrmActivity>(
    prisma.crmActivity,
    {
      where,
      orderBy: { createdAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<CrmActivity | null> {
  return prisma.crmActivity.findUnique({ where: { id } });
}

export interface CreateCrmInput {
  patientUserId: string;
  staffUserId?: string | null;
  type: CrmActivityType;
  note?: string | null;
  dueAt?: Date | null;
  status?: CrmActivityStatus;
}

export async function create(
  clinicId: string,
  input: CreateCrmInput,
): Promise<CrmActivity> {
  crmActivityTypeSchema.parse(input.type);
  if (input.status) crmActivityStatusSchema.parse(input.status);
  return prisma.crmActivity.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      staffUserId: input.staffUserId ?? null,
      type: input.type,
      note: input.note ?? null,
      dueAt: input.dueAt ?? null,
      status: input.status ?? "open",
    },
  });
}

export interface UpdateCrmInput {
  status?: CrmActivityStatus;
  note?: string | null;
  dueAt?: Date | null;
}

export async function update(
  id: string,
  patch: UpdateCrmInput,
): Promise<CrmActivity> {
  if (patch.status) crmActivityStatusSchema.parse(patch.status);
  return prisma.crmActivity.update({
    where: { id },
    data: { status: patch.status, note: patch.note, dueAt: patch.dueAt },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
