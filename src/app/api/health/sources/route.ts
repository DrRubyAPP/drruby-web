import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { healthRecordRepo, healthSourceRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { buildObjectKey, getStorage } from "@/lib/health/storage";
import { validateUploadFile } from "@/lib/health/upload";
import {
  HealthSourceListResponse,
  toSourceDTO,
  UploadSourceFields,
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
 * @description 上传一份原件（multipart/form-data：file 必填 + kind + recordedAt）。服务端按魔数校验类型/大小 → storage.put → 落 objectKey/mime/fileName → 建 HealthRecord(status=SOURCE_UPLOADED)。objectKey 由服务端按 F4 规范生成，客户端不可指定
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new AppError("UPLOAD_NO_FILE", "请选择要上传的文件", 400);
  }

  // 非文件字段（kind / recordedAt）经 Zod 校验
  const fields = UploadSourceFields.parse({
    kind: form.get("kind"),
    recordedAt: form.get("recordedAt"),
  });

  // 服务端为准：空文件 / 非白名单类型 / 超限 → 400（人话文案）
  const { mime } = await validateUploadFile(file);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const fileName = file.name?.trim() || "upload";
  const storage = getStorage();

  // 1. 先建 Source 行拿到 id（objectKey 含 sourceId，故须先有 id）
  const source = await healthSourceRepo.create(user.id, { fileName });

  // 2. 生成 F4 规范 key 并写入存储；写入失败则回滚 Source 行（不留孤儿记录）
  const objectKey = buildObjectKey(user.id, source.id, mime);
  try {
    await storage.put(objectKey, bytes, mime);
  } catch (cause) {
    await healthSourceRepo.remove(source.id).catch(() => {});
    throw new AppError(
      "UPLOAD_STORAGE_FAILED",
      "文件保存失败，请稍后重试",
      500,
      { cause },
    );
  }

  // 3. 回写真实 objectKey / mime / hash
  try {
    await healthSourceRepo.update(source.id, { objectKey, mime, hash });
  } catch (cause) {
    // 落库失败 → 删除已写对象 + Source 行回滚
    await storage.delete(objectKey).catch(() => {});
    await healthSourceRepo.remove(source.id).catch(() => {});
    throw new AppError(
      "UPLOAD_STORAGE_FAILED",
      "文件保存失败，请稍后重试",
      500,
      {
        cause,
      },
    );
  }

  // 4. 建 Record（status=SOURCE_UPLOADED）；抽取仍由 task-48 推进
  let record: { id: string };
  try {
    record = await healthRecordRepo.create(user.id, {
      sourceId: source.id,
      kind: fields.kind,
      title: fileName,
      status: "SOURCE_UPLOADED",
      recordedAt: new Date(fields.recordedAt),
    });
  } catch (cause) {
    await storage.delete(objectKey).catch(() => {});
    await healthSourceRepo.remove(source.id).catch(() => {});
    throw cause instanceof Error
      ? cause
      : new AppError("UPLOAD_FAILED", "上传失败，请稍后重试", 500);
  }

  return NextResponse.json(
    { sourceId: source.id, recordId: record.id },
    { status: 201 },
  );
});
