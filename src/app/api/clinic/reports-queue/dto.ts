import { z } from "zod";
import { reviewStatusSchema } from "@/lib/db/enums";

/** 报告审核队列 DTO（列表/详情共用）。draftContent / finalContent 为 Json 透传。 */
export const ClinicReportDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  status: reviewStatusSchema,
  draftContent: z.unknown().nullable(),
  finalContent: z.unknown().nullable(),
  reviewerUserId: z.string().nullable(),
  sentAt: z.string().nullable(),
});

export const ClinicReportListResponse = z.object({
  items: z.array(ClinicReportDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateClinicReportBody = z.object({
  patientUserId: z.string().min(1),
  draftContent: z.unknown(),
});

export const UpdateClinicReportBody = z.object({
  status: reviewStatusSchema,
  reviewerUserId: z.string().nullable().optional(),
  finalContent: z.unknown().nullable().optional(),
  sentAt: z.string().datetime().nullable().optional(),
});

/** 把 DB row 投影为 DTO。 */
export type ClinicReportRow = {
  id: string;
  patientUserId: string;
  status: string;
  draftContent: unknown;
  finalContent: unknown;
  reviewerUserId: string | null;
  sentAt: Date | null;
};

export function toClinicReportDTO(
  row: ClinicReportRow,
): z.infer<typeof ClinicReportDTO> {
  return {
    id: row.id,
    patientUserId: row.patientUserId,
    status: row.status as z.infer<typeof reviewStatusSchema>,
    draftContent: row.draftContent,
    finalContent: row.finalContent,
    reviewerUserId: row.reviewerUserId,
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
  };
}
