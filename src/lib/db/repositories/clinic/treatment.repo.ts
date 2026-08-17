import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { TreatmentStatus, TreatmentType } from "@/lib/db/enums";
import { treatmentStatusSchema, treatmentTypeSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Treatment } from "~prisma/client";
import { Prisma } from "~prisma/client";

export interface ListTreatmentFilter {
  status?: TreatmentStatus;
  patientUserId?: string;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListTreatmentFilter = {},
): Promise<PageResult<Treatment>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    treatmentStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  if (filter.patientUserId) {
    where.patientUserId = filter.patientUserId;
  }
  return paginate<Treatment>(
    prisma.treatment,
    {
      where,
      orderBy: { createdAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<Treatment | null> {
  return prisma.treatment.findUnique({ where: { id } });
}

export interface CreateTreatmentInput {
  patientUserId: string;
  staffUserId?: string | null;
  name: string;
  type?: TreatmentType | null;
  status?: TreatmentStatus;
  scheduledAt?: Date | null;
  amount?: number | string | null;
  currency?: string;
  note?: string | null;
}

export async function create(
  clinicId: string,
  input: CreateTreatmentInput,
): Promise<Treatment> {
  if (input.type) treatmentTypeSchema.parse(input.type);
  if (input.status) treatmentStatusSchema.parse(input.status);
  return prisma.treatment.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      staffUserId: input.staffUserId ?? null,
      name: input.name,
      type: input.type ?? null,
      status: input.status ?? "planned",
      scheduledAt: input.scheduledAt ?? null,
      amount: input.amount != null ? new Prisma.Decimal(input.amount) : null,
      currency: input.currency ?? "USD",
      note: input.note ?? null,
    },
  });
}

export interface UpdateTreatmentInput {
  status?: TreatmentStatus;
  note?: string | null;
}

export async function update(
  id: string,
  patch: UpdateTreatmentInput,
): Promise<Treatment> {
  if (patch.status) treatmentStatusSchema.parse(patch.status);
  return prisma.treatment.update({
    where: { id },
    data: { status: patch.status, note: patch.note },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
