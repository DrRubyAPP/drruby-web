import { z } from "zod";

/** 患者 DTO（派生只读视图）：对齐 clinic-portal-mock 的 Patient 形状。 */
export const PatientDTO = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  ageRange: z.string().nullable(),
  concern: z.string().nullable(),
  lastScan: z.string().nullable(),
  indices: z.object({
    inflammation: z.number().nullable(),
    pigmentation: z.number().nullable(),
    texture: z.number().nullable(),
  }),
  authStatus: z.string().nullable(),
  status: z.enum(["active", "pending", "new"]),
  nextAppointment: z.string().nullable(),
});

export const PatientListResponse = z.object({
  items: z.array(PatientDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const PatientAuthorizationDTO = z.object({
  id: z.string(),
  scopes: z.array(z.string()),
  status: z.string(),
  grantedAt: z.string(),
  revokedAt: z.string().nullable(),
});

export const PatientScanDTO = z.object({
  id: z.string(),
  capturedAt: z.string(),
  inflammation: z.number().nullable(),
  pigmentation: z.number().nullable(),
  texture: z.number().nullable(),
  trend: z.string().nullable(),
});

export const PatientDetailDTO = PatientDTO.extend({
  authorizations: z.array(PatientAuthorizationDTO),
  recentScans: z.array(PatientScanDTO),
});
