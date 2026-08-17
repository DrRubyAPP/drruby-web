import { z } from "zod";
import { invoiceStatusSchema } from "@/lib/db/enums";

/** 发票 DTO（列表/详情共用）：金额由 Decimal 序列化为字符串，含患者名投影。 */
export const InvoiceDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  amount: z.string(),
  currency: z.string(),
  status: invoiceStatusSchema,
  issuedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
});

export const InvoiceListResponse = z.object({
  items: z.array(InvoiceDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateInvoiceBody = z.object({
  patientUserId: z.string().min(1),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
});

export const UpdateInvoiceBody = z.object({
  status: invoiceStatusSchema,
});

/** 把 DB row 投影为 DTO：patientName 由调用方从 nameMap 注入。 */
export type InvoiceRow = {
  id: string;
  patientUserId: string;
  amount: { toString(): string };
  currency: string;
  status: string;
  issuedAt: Date | null;
  paidAt: Date | null;
};

export function toInvoiceDTO(
  row: InvoiceRow,
  patientName: string | null,
): z.infer<typeof InvoiceDTO> {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    patientName,
    amount: row.amount.toString(),
    currency: row.currency,
    status: row.status as z.infer<typeof invoiceStatusSchema>,
    issuedAt: row.issuedAt ? row.issuedAt.toISOString() : null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}
