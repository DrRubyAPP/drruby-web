import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/errors";
import { generateBodyInsights } from "@/lib/insights/generate";

/** 刷新结果：各 kind 实际写入条数。 */
export const RefreshResponse = z.object({
  attention: z.number().int().nonnegative(),
  agingVelocity: z.number().int().nonnegative(),
});

/**
 * Refresh body insights
 * @description 重算当前用户的 attention / aging_velocity 洞察并写入（替换旧行，幂等）。
 * 数值/置信/accent/tone 由规则确定，LLM 仅润色文案且可降级；缺 key 仍产出规则原文。
 * @response RefreshResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async () => {
  const user = await requireUser();
  // 重算洞察是重操作（LLM + DB）→ per-user 限流 6 req/min（Retry-After=10s）
  await rateLimit(user.id, {
    routeTag: "insights-refresh",
    capacity: 6,
    refillRate: 0.1,
  });
  const counts = await generateBodyInsights(user.id);
  return NextResponse.json(RefreshResponse.parse(counts));
});
