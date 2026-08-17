import { z } from "zod";
import { trendSchema } from "@/lib/db/enums";

/** 皮肤档案扫描记录 DTO（对齐 clinic-portal-mock 的 ScanRecord）。 */
export const ScanRecordDTO = z.object({
  id: z.string(),
  patientUserId: z.string(),
  patientName: z.string().nullable(),
  objectKey: z.string(),
  capturedAt: z.string(), // ISO
  inflammatoryScore: z.number().nullable(),
  pigmentationScore: z.number().nullable(),
  textureScore: z.number().nullable(),
  trend: trendSchema.nullable(),
});

export const ScanRecordListResponse = z.object({
  items: z.array(ScanRecordDTO),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const CreateScanRecordBody = z.object({
  patientUserId: z.string().min(1),
  objectKey: z.string().min(1),
  inflammatoryScore: z.number().optional(),
  pigmentationScore: z.number().optional(),
  textureScore: z.number().optional(),
  trend: trendSchema.nullable().optional(),
  capturedAt: z.string().datetime(),
});

export const UpdateScanRecordBody = z.object({
  // skin_archive 无 note 列，PATCH 仅支持趋势（trend）
  trend: trendSchema.nullable().optional(),
});

/** 把 DB row 投影为 DTO：patientName 由调用方从 nameMap 注入。 */
export type ScanRow = {
  id: string;
  patientUserId: string;
  objectKey: string;
  capturedAt: Date;
  inflammatoryScore: unknown;
  pigmentationScore: unknown;
  textureScore: unknown;
  trend: string | null;
};

export function toScanRecordDTO(row: ScanRow, patientName: string | null) {
  return ScanRecordDTO.parse({
    id: row.id,
    patientUserId: row.patientUserId,
    patientName,
    objectKey: row.objectKey,
    capturedAt: row.capturedAt.toISOString(),
    inflammatoryScore:
      row.inflammatoryScore != null ? Number(row.inflammatoryScore) : null,
    pigmentationScore:
      row.pigmentationScore != null ? Number(row.pigmentationScore) : null,
    textureScore: row.textureScore != null ? Number(row.textureScore) : null,
    trend: row.trend as z.infer<typeof trendSchema> | null,
  });
}
