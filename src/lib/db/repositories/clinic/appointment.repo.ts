import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { AppointmentStatus } from "@/lib/db/enums";
import { appointmentStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Appointment } from "~prisma/client";

export interface ListAppointmentFilter {
  status?: AppointmentStatus;
  from?: Date;
  to?: Date;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListAppointmentFilter = {},
): Promise<PageResult<Appointment>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    appointmentStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  if (filter.from || filter.to) {
    where.scheduledAt = {};
    if (filter.from)
      (where.scheduledAt as Record<string, unknown>).gte = filter.from;
    if (filter.to)
      (where.scheduledAt as Record<string, unknown>).lte = filter.to;
  }
  return paginate<Appointment>(
    prisma.appointment,
    {
      where,
      orderBy: { scheduledAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<Appointment | null> {
  return prisma.appointment.findUnique({ where: { id } });
}

export interface CreateAppointmentInput {
  patientUserId: string;
  staffUserId?: string | null;
  referralId?: string | null;
  scheduledAt: Date;
  note?: string | null;
}

export async function create(
  clinicId: string,
  input: CreateAppointmentInput,
): Promise<Appointment> {
  return prisma.appointment.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      staffUserId: input.staffUserId ?? null,
      referralId: input.referralId ?? null,
      scheduledAt: input.scheduledAt,
      note: input.note ?? null,
      status: "scheduled",
    },
  });
}

export async function update(
  id: string,
  patch: { status?: AppointmentStatus; note?: string | null },
): Promise<Appointment> {
  if (patch.status) appointmentStatusSchema.parse(patch.status);
  return prisma.appointment.update({
    where: { id },
    data: { status: patch.status, note: patch.note },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
