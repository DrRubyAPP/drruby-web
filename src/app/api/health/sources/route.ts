import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { healthSourceRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import {
  HealthSourceListResponse,
  toSourceDTO,
  UploadSourceBody,
} from "../dto";

/**
 * List health sources
 * @description 当前用户上传的原件列表（HealthSource，最新在前）
 * @response HealthSourceListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await healthSourceRepo.listByUser(user.id);
  return NextResponse.json(
    HealthSourceListResponse.parse(rows.map(toSourceDTO)),
  );
});

/**
 * Upload health source
 * @description 上传一份原件（V1 占位存储：objectKey 为本地路径/字符串）。同步建 HealthRecord（status=SOURCE_UPLOADED），由前端触发抽取推进状态机
 * @body UploadSourceBody
 * @response { sourceId: string, recordId: string }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = UploadSourceBody.parse(await req.json());

  // 1. 建 Source 原件
  const source = await healthSourceRepo.create(user.id, {
    fileName: body.fileName,
    mime: body.mime,
    objectKey: body.objectKey,
  });

  // 2. 建 Record（status=SOURCE_UPLOADED）；task-42 V1 不在此触发抽取
  //    前端通过 PATCH /api/health/records/[id] action=advance 推进状态机
  const { healthRecordRepo } = await import("@/lib/db");
  const record = await healthRecordRepo.create(user.id, {
    sourceId: source.id,
    kind: body.kind,
    title: body.fileName,
    status: "SOURCE_UPLOADED",
    recordedAt: new Date(body.recordedAt),
  });

  return NextResponse.json(
    { sourceId: source.id, recordId: record.id },
    { status: 201 },
  );
});
