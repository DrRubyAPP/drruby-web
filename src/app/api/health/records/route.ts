import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { healthRecordRepo } from "@/lib/db";
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
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await healthRecordRepo.listByUser(user.id);
  return NextResponse.json(
    HealthRecordListResponse.parse(rows.map((r) => toRecordDTO(r))),
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
    parsedValues: body.parsedValues ? (body.parsedValues as never) : undefined,
    status: "CONFIRMED",
    ocrStatus: "manual", // 兼容字段
    recordedAt: new Date(body.recordedAt),
  });

  return NextResponse.json(toRecordDTO(row), { status: 201 });
});
