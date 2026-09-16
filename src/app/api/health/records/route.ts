import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { healthMetricDefinitionRepo, healthRecordRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import { HealthRecordListResponse, ManualLogBody, toRecordDTO } from "../dto";

/**
 * List health records
 * @description 当前用户的健康记录（含原件 + 状态机，最新在前）
 * @response HealthRecordListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
const HealthRecordListQuery = z.object({
  at: z.iso.datetime().optional(),
  observationId: z.string().min(1).optional(),
});

export const GET = handle(async (req?: Request) => {
  const user = await requireUser();
  const { at, observationId } = HealthRecordListQuery.parse(
    req ? Object.fromEntries(new URL(req.url).searchParams) : {},
  );
  const rows = await healthRecordRepo.listByUser(user.id, {
    recordedAtOrBefore: at ? new Date(at) : undefined,
    observationId,
  });
  return NextResponse.json(
    HealthRecordListResponse.parse(
      await Promise.all(
        rows.map(async (row) =>
          toRecordDTO(
            row,
            await healthMetricDefinitionRepo.resolveDisplayName(row),
          ),
        ),
      ),
    ),
  );
});

/**
 * Create manual log
 * @description 手动录入一条健康记录（不走 Extractor，直接 status=CONFIRMED）。Contract §12 V1 采集方式之一：manual log
 * @body ManualLogBody
 * @response HealthRecordDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = ManualLogBody.parse(await req.json());

  // 手动录入：repo 自动建 placeholder Source + status=CONFIRMED
  const row = await healthRecordRepo.create(user.id, {
    kind: body.kind,
    title: body.title,
    observationId: body.observationId,
    parsedValues: body.parsedValues ? (body.parsedValues as never) : undefined,
    status: "CONFIRMED",
    ocrStatus: "manual", // 兼容字段
    recordedAt: new Date(body.recordedAt),
  });

  return NextResponse.json(
    toRecordDTO(row, await healthMetricDefinitionRepo.resolveDisplayName(row)),
    { status: 201 },
  );
});
