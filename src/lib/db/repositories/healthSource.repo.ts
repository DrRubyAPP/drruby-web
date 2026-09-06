import { prisma } from "@/lib/db/prisma";
import type { HealthSource, Prisma } from "~prisma/client";

export type HealthSourceWithRecord = Prisma.HealthSourceGetPayload<{
  include: { record: true };
}>;

export interface CreateHealthSourceInput {
  fileName: string;
  mime?: string | null;
  hash?: string | null;
  objectKey?: string | null;
  storageLifecycle?: string | null;
  provenance?: Prisma.InputJsonValue | null;
}

/**
 * 创建 HealthSource 原件（Contract §12 Source 层）
 * V1 占位存储：objectKey 为本地路径/字符串，S3/R2/GCS 延后（O3）
 */
export async function create(
  userId: string,
  input: CreateHealthSourceInput,
): Promise<HealthSource> {
  return prisma.healthSource.create({
    data: {
      userId,
      fileName: input.fileName,
      mime: input.mime ?? null,
      hash: input.hash ?? null,
      objectKey: input.objectKey ?? null,
      storageLifecycle: input.storageLifecycle ?? null,
      provenance: input.provenance ?? undefined,
    },
  });
}

/**
 * 更新原件存储元数据（task-46：storage.put 成功后回写真实 objectKey / mime / hash）。
 * key 由服务端生成（含 sourceId），故须先建行拿到 id 再回写。
 */
export async function update(
  id: string,
  input: {
    objectKey?: string | null;
    mime?: string | null;
    hash?: string | null;
    storageLifecycle?: string | null;
  },
): Promise<HealthSource> {
  return prisma.healthSource.update({
    where: { id },
    data: {
      objectKey: input.objectKey ?? undefined,
      mime: input.mime ?? undefined,
      hash: input.hash ?? undefined,
      storageLifecycle: input.storageLifecycle ?? undefined,
    },
  });
}

/**
 * 删除原件行（task-46：上传链路失败时回滚已建的 placeholder 行）。
 * 用户主动删除（留痕）属 task-49，不在本任务调用。
 */
export async function remove(id: string): Promise<void> {
  await prisma.healthSource.delete({ where: { id } });
}

/** 按 uploadedAt 倒序列出某用户的原件 */
export async function listByUser(userId: string): Promise<HealthSource[]> {
  return prisma.healthSource.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
  });
}

/** 单个原件（含 1:1 record 关联） */
export async function findById(
  id: string,
): Promise<HealthSourceWithRecord | null> {
  return prisma.healthSource.findUnique({
    where: { id },
    include: { record: true },
  });
}
