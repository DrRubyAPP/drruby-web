import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { healthRecordRepo } from "@/lib/db";
import { healthRecordKindSchema, ocrStatusSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { HealthRecord } from "~prisma/client";

/** 健康报告 DTO（append-only：无 PATCH 端点，原始记录不被覆盖） */
export const HealthRecordDTO = z.object({
  id: z.string(),
  kind: healthRecordKindSchema,
  title: z.string(),
  source: z.string().optional(),
  objectKey: z.string().optional(),
  ocrStatus: ocrStatusSchema,
  recordedAt: z.string().describe("记录时间 ISO（← recordedAt）"),
});
export const HealthRecordListResponse = z.array(HealthRecordDTO);

/** 新增健康报告入参（本轮人工录入，ocrStatus=manual） */
export const CreateHealthRecordBody = z.object({
  kind: healthRecordKindSchema,
  title: z.string().min(1),
  source: z.string().optional(),
  objectKey: z.string().optional(),
  recordedAt: z.string().describe("记录时间 ISO"),
});

function toDTO(row: HealthRecord): z.infer<typeof HealthRecordDTO> {
  return {
    id: row.id,
    kind: healthRecordKindSchema.parse(row.kind),
    title: row.title,
    source: row.source ?? undefined,
    objectKey: row.objectKey ?? undefined,
    ocrStatus: ocrStatusSchema.parse(row.ocrStatus),
    recordedAt: row.recordedAt.toISOString(),
  };
}

/**
 * List health reports
 * @description 当前用户的健康报告（化验/影像/体检/生命体征，最新在前）
 * @response HealthRecordListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await healthRecordRepo.listByUser(user.id);
  return NextResponse.json(HealthRecordListResponse.parse(rows.map(toDTO)));
});

/**
 * Create health report
 * @description 人工录入一条健康报告（ocrStatus=manual）。非法 kind → 400
 * @body CreateHealthRecordBody
 * @response HealthRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = CreateHealthRecordBody.parse(await req.json());
  const row = await healthRecordRepo.create(user.id, {
    kind: body.kind,
    title: body.title,
    source: body.source ?? null,
    objectKey: body.objectKey ?? null,
    ocrStatus: "manual",
    recordedAt: new Date(body.recordedAt),
  });
  return NextResponse.json(toDTO(row), { status: 201 });
});
