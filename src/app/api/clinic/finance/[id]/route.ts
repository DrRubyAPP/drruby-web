import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { invoiceRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import type { InvoiceStatus } from "@/lib/db/enums";
import { InvoiceDTO, toInvoiceDTO, UpdateInvoiceBody } from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/** 发票状态机：draft → sent → paid | void（任一逆向/跳步均 422）。 */
const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "void"],
  sent: ["paid", "void"],
  paid: ["void"],
  void: [],
};

/**
 * Get invoice detail
 * @description 单条发票；归属不匹配按 404
 * @pathParams { id: string }
 * @response InvoiceDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await invoiceRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toInvoiceDTO(row, names.get(row.patientUserId) ?? null),
  );
});

/**
 * Update invoice
 * @description 推进状态机（draft→sent→paid|void）；sent 置 issuedAt、paid 置 paidAt；非法跃迁 422
 * @pathParams { id: string }
 * @body UpdateInvoiceBody
 * @response InvoiceDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await invoiceRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateInvoiceBody.parse(await req.json());
  if (!INVOICE_TRANSITIONS[existing.status as InvoiceStatus].includes(body.status)) {
    throw new AppError(
      "validation_error",
      `非法状态跃迁 ${existing.status} → ${body.status}`,
      422,
    );
  }
  const patch: { status: InvoiceStatus; issuedAt?: Date | null; paidAt?: Date | null } = {
    status: body.status,
  };
  if (body.status === "sent") patch.issuedAt = existing.issuedAt ?? new Date();
  if (body.status === "paid") patch.paidAt = existing.paidAt ?? new Date();
  const row = await invoiceRepo.update(id, patch);
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(
    toInvoiceDTO(row, names.get(row.patientUserId) ?? null),
  );
});
