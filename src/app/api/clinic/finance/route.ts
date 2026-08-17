import { NextResponse } from "next/server";
import { parsePageParams } from "@/lib/api/pagination";
import { requireClinicUser } from "@/lib/auth/clinic";
import { invoiceRepo } from "@/lib/db";
import { patientNameMap } from "@/lib/db/repositories/clinic/patientNames";
import { AppError, handle } from "@/lib/errors";
import type { InvoiceStatus } from "@/lib/db/enums";
import {
  CreateInvoiceBody,
  InvoiceDTO,
  InvoiceListResponse,
  toInvoiceDTO,
} from "./dto";

type Ctx = { params: Promise<Record<string, never>> };

/**
 * List clinic invoices
 * @description 按 clinicId 过滤 + 分页；支持 status 筛选
 * @response InvoiceListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const sp = new URL(req.url).searchParams;
  const pp = parsePageParams(sp);
  const res = await invoiceRepo.listByClinic(clinicId, pp, {
    status: (sp.get("status") as never) || undefined,
  });
  const names = await patientNameMap(res.items.map((a) => a.patientUserId));
  const dto = res.items.map((a) =>
    toInvoiceDTO(a, names.get(a.patientUserId) ?? null),
  );
  return NextResponse.json(InvoiceListResponse.parse({ ...res, items: dto }));
});

/**
 * Create invoice
 * @description 诊所开票（clinicId 来自会话，不允许客户端覆盖）；默认 status=draft
 * @body CreateInvoiceBody
 * @response InvoiceDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const { clinicId } = await requireClinicUser();
  const body = CreateInvoiceBody.parse(await req.json());
  const row = await invoiceRepo.create(clinicId, {
    patientUserId: body.patientUserId,
    amount: body.amount,
    currency: body.currency,
    issuedAt: body.issuedAt ? new Date(body.issuedAt) : null,
  });
  const names = await patientNameMap([row.patientUserId]);
  return NextResponse.json(toInvoiceDTO(row, names.get(row.patientUserId) ?? null));
});
