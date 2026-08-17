import { z } from "zod";
import { appointmentStatusSchema } from "@/lib/db/enums";

/** 预约 DTO（列表/详情共用）：含患者名投影。 */
export const AppointmentDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  staffUserId: z.string().nullable(),
  referralId: z.string().nullable(),
  scheduledAt: z.string(), // ISO
  status: appointmentStatusSchema,
  note: z.string().nullable(),
});

export const AppointmentListResponse = z.object({
  items: z.array(AppointmentDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateAppointmentBody = z.object({
  patientUserId: z.string().min(1),
  staffUserId: z.string().optional(),
  referralId: z.string().optional(),
  scheduledAt: z.string().datetime(),
  note: z.string().optional(),
});

export const UpdateAppointmentBody = z.object({
  status: appointmentStatusSchema.optional(),
  note: z.string().nullable().optional(),
});

/** 把 DB row 投影为 DTO：patientName 由调用方从 nameMap 注入（repo 不耦合患者名查询）。 */
export type AppointmentRow = {
  id: string;
  patientUserId: string;
  staffUserId: string | null;
  referralId: string | null;
  scheduledAt: Date;
  status: string;
  note: string | null;
};

export function toAppointmentDTO(
  row: AppointmentRow,
  patientName: string | null,
): z.infer<typeof AppointmentDTO> {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    patientName,
    staffUserId: row.staffUserId,
    referralId: row.referralId,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status as z.infer<typeof appointmentStatusSchema>,
    note: row.note,
  };
}
