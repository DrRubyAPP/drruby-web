import { Prisma } from "~prisma/client";
import type { PageParams, PageResult } from "@/lib/api/pagination";
import { paginate } from "@/lib/api/pagination";
import type { InvoiceStatus } from "@/lib/db/enums";
import { invoiceStatusSchema } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { Invoice } from "~prisma/client";

export interface ListInvoiceFilter {
  status?: InvoiceStatus;
}

export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListInvoiceFilter = {},
): Promise<PageResult<Invoice>> {
  const where: Record<string, unknown> = { clinicId };
  if (filter.status) {
    invoiceStatusSchema.parse(filter.status);
    where.status = filter.status;
  }
  return paginate<Invoice>(
    prisma.invoice,
    {
      where,
      orderBy: { createdAt: "desc" },
    },
    pp,
  );
}

export async function findById(id: string): Promise<Invoice | null> {
  return prisma.invoice.findUnique({ where: { id } });
}

export interface CreateInvoiceInput {
  patientUserId: string;
  amount: number | string;
  currency?: string;
  issuedAt?: Date | null;
}

export async function create(
  clinicId: string,
  input: CreateInvoiceInput,
): Promise<Invoice> {
  return prisma.invoice.create({
    data: {
      clinicId,
      patientUserId: input.patientUserId,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency ?? "USD",
      status: "draft",
    },
  });
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  issuedAt?: Date | null;
  paidAt?: Date | null;
}

export async function update(
  id: string,
  patch: UpdateInvoiceInput,
): Promise<Invoice> {
  if (patch.status) invoiceStatusSchema.parse(patch.status);
  return prisma.invoice.update({
    where: { id },
    data: {
      status: patch.status,
      issuedAt: patch.issuedAt,
      paidAt: patch.paidAt,
    },
  });
  // 调用方需先确认 row.clinicId === clinicId，否则 404（归属不匹配）
}
