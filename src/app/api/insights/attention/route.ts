import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { bodyInsightRepo } from "@/lib/db";
import { insightAccentSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { BodyInsight } from "~prisma/client";

/** App `getAttention` 卡片（body_insight kind=attention 投影） */
export const AttentionDTO = z.object({
  id: z.string(),
  tag: z.string(),
  title: z.string(),
  body: z.string(),
  accent: insightAccentSchema,
});
export const AttentionListResponse = z.array(AttentionDTO);

function toDTO(row: BodyInsight): z.infer<typeof AttentionDTO> {
  return {
    id: row.id,
    tag: row.tag ?? "",
    title: row.title,
    body: row.body ?? "",
    // accent 缺省兜底 purple（P1 占位；P2 由洞察引擎回填规范值）
    accent: row.accent ? insightAccentSchema.parse(row.accent) : "purple",
  };
}

/**
 * List attention cards
 * @description 首页「今日值得关注」卡片（无数据返回 []）
 * @response AttentionListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await bodyInsightRepo.listByUserAndKind(user.id, "attention");
  return NextResponse.json(AttentionListResponse.parse(rows.map(toDTO)));
});
