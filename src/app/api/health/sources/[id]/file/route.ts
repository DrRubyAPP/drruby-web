import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { healthSourceRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { getStorage } from "@/lib/health/storage";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Read health source file
 * @description 统一读取入口（task-46 F5）。校验 session + 归属；r2 → 302 到 60s presigned；local → 直接流式响应。越权/无 objectKey → 404
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const source = await healthSourceRepo.findById(id);
  // 越权按「不存在」处理：不返回 403，避免存在性探测
  if (!source || source.userId !== user.id) {
    throw new AppError("NOT_FOUND", "文件不存在", 404);
  }
  // 历史占位数据（无真实对象）→ 404 + 明确文案，不做兼容解析
  if (!source.objectKey) {
    throw new AppError(
      "SOURCE_NO_OBJECT",
      "该原件无可下载文件，请重新上传",
      404,
    );
  }

  const storage = getStorage();
  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();

  if (driver === "r2") {
    const url = await storage.getSignedUrl(source.objectKey, { expiresIn: 60 });
    return NextResponse.redirect(url, 302);
  }

  // local：直接流式响应
  const bytes = await storage.get(source.objectKey);
  const body = new Uint8Array(bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": source.mime ?? "application/octet-stream",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename="${encodeURIComponent(source.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
