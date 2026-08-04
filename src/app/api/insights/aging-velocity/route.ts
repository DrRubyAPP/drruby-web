import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { bodyInsightRepo } from "@/lib/db";
import { insightToneSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { BodyInsight } from "~prisma/client";

/** App `types.ts` AgingMetric（body_insight kind=aging_velocity 投影） */
export const AgingMetricDTO = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  caption: z.string(),
  tone: insightToneSchema,
});
export const AgingVelocityListResponse = z.array(AgingMetricDTO);

function toDTO(row: BodyInsight): z.infer<typeof AgingMetricDTO> {
  return {
    id: row.id,
    label: row.label ?? "",
    value: row.value ?? "",
    caption: row.caption ?? "",
    // tone 缺省兜底 green（P1 占位；P2 由洞察引擎回填规范值）
    tone: row.tone ? insightToneSchema.parse(row.tone) : "green",
  };
}

/**
 * List aging-velocity metrics
 * @description 变化速度指标（示意，非结论；无数据返回 []）
 * @response AgingVelocityListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await bodyInsightRepo.listByUserAndKind(
    user.id,
    "aging_velocity",
  );
  return NextResponse.json(AgingVelocityListResponse.parse(rows.map(toDTO)));
});
