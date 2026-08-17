import { z } from "zod";
import { treatmentStatusSchema, treatmentTypeSchema } from "@/lib/db/enums";

/** 治疗 DTO（列表/详情共用）：金额 Decimal 序列化为字符串（可空），含患者名投影。 */
export const TreatmentDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  staffUserId: z.string().nullable(),
  name: z.string(),
  type: treatmentTypeSchema.nullable(),
  status: treatmentStatusSchema,
  amount: z.string().nullable(),
  currency: z.string(),
  scheduledAt: z.string().nullable(), // ISO
  note: z.string().nullable(),
});

export const TreatmentListResponse = z.object({
  items: z.array(TreatmentDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateTreatmentBody = z.object({
  patientUserId: z.string().min(1),
  staffUserId: z.string().optional(),
  name: z.string().min(1),
  type: treatmentTypeSchema.optional(),
  status: treatmentStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  note: z.string().optional(),
});

export const UpdateTreatmentBody = z.object({
  status: treatmentStatusSchema.optional(),
  note: z.string().nullable().optional(),
});

/** 把 DB row 投影为 DTO：patientName 由调用方从 nameMap 注入（repo 不耦合患者名查询）。 */
export type TreatmentRow = {
  id: string;
  patientUserId: string;
  staffUserId: string | null;
  name: string;
  type: string | null;
  status: string;
  amount: { toString(): string } | null;
  currency: string;
  scheduledAt: Date | null;
  note: string | null;
};

export function toTreatmentDTO(
  row: TreatmentRow,
  patientName: string | null,
): z.infer<typeof TreatmentDTO> {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    patientName,
    staffUserId: row.staffUserId,
    name: row.name,
    type: (row.type as z.infer<typeof treatmentTypeSchema>) ?? null,
    status: row.status as z.infer<typeof treatmentStatusSchema>,
    amount: row.amount ? row.amount.toString() : null,
    currency: row.currency,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    note: row.note,
  };
}
