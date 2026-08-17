import { z } from "zod";
import { authorizationStatusSchema } from "@/lib/db/enums";

/** 合规授权 DTO（列表项）。 */
export const ComplianceItemDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  scopes: z.array(z.string()),
  status: authorizationStatusSchema,
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
});

export const ComplianceListResponse = z.object({
  items: z.array(ComplianceItemDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

/** 审计流水 DTO。 */
export const ComplianceAuditDTO = z.object({
  id: z.string(),
  action: z.string(),
  actorUserId: z.string().nullable(),
  createdAt: z.string(),
});

/** 合规授权详情 + 审计流水。 */
export const ComplianceDetailDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  scopes: z.array(z.string()),
  status: authorizationStatusSchema,
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
  audit: z.array(ComplianceAuditDTO),
});

export const UpdateComplianceBody = z.object({});
