import { AppError } from "@/lib/errors";

/**
 * 上传校验（task-46 F8）——**服务端为准**，前端限制仅体验优化。
 *
 * 类型判定按魔数（magic number），不信任客户端 Content-Type 与扩展名；
 * 大小按类型分别设上限（先看 file.size，不整体 buffer 进内存再判）。
 */

/** 白名单 MIME。 */
export type AllowedMime = "application/pdf" | "image/jpeg" | "image/png";

export const DOC_MAX_BYTES = 20 * 1024 * 1024; // PDF ≤ 20MB
/** 图片硬上限：客户端压缩目标 1.5MB，压缩失败降级原图，故服务端放宽到 25MB。 */
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;

/**
 * 按魔数嗅探真实类型；非白名单返回 null。
 * - PDF：`25 50 44 46`（%PDF）
 * - JPEG：`FF D8 FF`
 * - PNG：`89 50 4E 47`
 */
export function detectMime(header: Uint8Array): AllowedMime | null {
  if (
    header.length >= 4 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46
  ) {
    return "application/pdf";
  }
  if (
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    header.length >= 4 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

/** 该类型允许的最大字节数。 */
export function maxBytesFor(mime: AllowedMime): number {
  return mime === "application/pdf" ? DOC_MAX_BYTES : IMAGE_MAX_BYTES;
}

/** 字节数 → 人话 MB（一位小数）。 */
function toMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export interface ValidatedUpload {
  mime: AllowedMime;
}

/**
 * 校验上传的 File：空文件 / 非白名单类型 / 超限 → 抛 400 AppError（人话文案）。
 * 只读前 8 字节做类型嗅探，用 `file.size` 做大小拦截，不整体读入内存。
 */
export async function validateUploadFile(file: File): Promise<ValidatedUpload> {
  if (file.size === 0) {
    throw new AppError("UPLOAD_EMPTY", "文件为空，请选择有效文件后重试", 400);
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const mime = detectMime(header);
  if (!mime) {
    throw new AppError(
      "UPLOAD_UNSUPPORTED_TYPE",
      "不支持的文件类型，仅接受 PDF、JPEG、PNG",
      400,
    );
  }

  const max = maxBytesFor(mime);
  if (file.size > max) {
    throw new AppError(
      "UPLOAD_TOO_LARGE",
      `文件超过 ${toMb(max)}MB，请压缩后重试`,
      400,
    );
  }

  return { mime };
}
