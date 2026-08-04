import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { skinScanRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import type { SkinScan } from "~prisma/client";

/** App `types.ts` SkinZone / SkinScanResult（`date ← scannedAt`；无记录返回 null） */
export const SkinZoneDTO = z.object({ name: z.string(), status: z.string() });
export const SkinScanResponse = z
  .object({
    date: z.string(),
    headline: z.string(),
    zones: z.array(SkinZoneDTO),
  })
  .nullable();

function toDTO(row: SkinScan): NonNullable<z.infer<typeof SkinScanResponse>> {
  return {
    date: row.scannedAt.toISOString(),
    headline: row.headline,
    // zones 以 JSON 存储（[{name,status}]），出参处 Zod 兜底校验形状
    zones: z.array(SkinZoneDTO).parse(row.zones),
  };
}

/**
 * Get latest skin scan
 * @description 当前用户最近一次皮肤扫描结果（无记录返回 null）
 * @response SkinScanResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const row = await skinScanRepo.findLatest(user.id);
  return NextResponse.json(SkinScanResponse.parse(row ? toDTO(row) : null));
});
