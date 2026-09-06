import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import { LocalDiskStorageProvider } from "./localDisk";
import { R2StorageProvider } from "./r2";
import type { StorageProvider } from "./types";

export { LocalDiskStorageProvider } from "./localDisk";
export { R2StorageProvider } from "./r2";
export type { StorageProvider } from "./types";
export { DEFAULT_SIGNED_URL_TTL } from "./types";

/** 白名单类型 → 存储扩展名（由服务端按魔数判定，不信任客户端扩展名）。 */
const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * 按 F4 规范生成 objectKey：`health/{userId}/{sourceId}/{uuid}.{ext}`。
 * 原文件名不进 key；含 uuid 保证不可枚举。mime 须为白名单类型。
 */
export function buildObjectKey(
  userId: string,
  sourceId: string,
  mime: string,
): string {
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    throw new AppError(
      "STORAGE_UNSUPPORTED_MIME",
      `不支持的类型：${mime}`,
      400,
    );
  }
  return `health/${userId}/${sourceId}/${randomUUID()}.${ext}`;
}

let cached: StorageProvider | null = null;
let cachedDriver: string | null = null;

/**
 * 存储工厂：按 `STORAGE_DRIVER=local|r2`（默认 local）返回单例。
 * 业务代码只依赖返回的 StorageProvider 接口，切换后端只改环境变量（验收 A4）。
 */
export function getStorage(): StorageProvider {
  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (cached && cachedDriver === driver) return cached;

  switch (driver) {
    case "local":
      cached = new LocalDiskStorageProvider();
      break;
    case "r2":
      cached = new R2StorageProvider();
      break;
    default:
      throw new AppError(
        "STORAGE_UNKNOWN_DRIVER",
        `未知 STORAGE_DRIVER：${driver}（应为 local|r2）`,
        500,
      );
  }
  cachedDriver = driver;
  return cached;
}

/** 仅供测试：清空工厂单例缓存，让下次 getStorage 按当前 env 重建。 */
export function __resetStorageForTest(): void {
  cached = null;
  cachedDriver = null;
}
