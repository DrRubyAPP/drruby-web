import { z } from "zod";
import { crmActivityStatusSchema, crmActivityTypeSchema } from "@/lib/db/enums";

/** CRM 活动 DTO（列表/详情共用）：含患者名投影。 */
export const CrmActivityDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  staffUserId: z.string().nullable(),
  type: crmActivityTypeSchema,
  note: z.string().nullable(),
  dueAt: z.string().nullable(), // ISO
  status: crmActivityStatusSchema,
});

export const CrmActivityListResponse = z.object({
  items: z.array(CrmActivityDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateCrmActivityBody = z.object({
  patientUserId: z.string().min(1),
  staffUserId: z.string().optional(),
  type: crmActivityTypeSchema,
  note: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  status: crmActivityStatusSchema.optional(),
});

export const UpdateCrmActivityBody = z.object({
  status: crmActivityStatusSchema.optional(),
  note: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

/** 把 DB row 投影为 DTO：patientName 由调用方从 nameMap 注入（repo 不耦合患者名查询）。 */
export type CrmActivityRow = {
  id: string;
  patientUserId: string;
  staffUserId: string | null;
  type: string;
  note: string | null;
  dueAt: Date | null;
  status: string;
};

export function toCrmActivityDTO(
  row: CrmActivityRow,
  patientName: string | null,
): z.infer<typeof CrmActivityDTO> {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    patientName,
    staffUserId: row.staffUserId,
    type: row.type as z.infer<typeof crmActivityTypeSchema>,
    note: row.note,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    status: row.status as z.infer<typeof crmActivityStatusSchema>,
  };
}
