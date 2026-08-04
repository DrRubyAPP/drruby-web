import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { signalRepo } from "@/lib/db";
import { signalConfidenceSchema, signalTrendSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { Signal } from "~prisma/client";

/** App `types.ts` Signal */
export const SignalDTO = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  source: z.string(),
  confidence: signalConfidenceSchema,
  trend: signalTrendSchema.optional(),
});
export const SignalListResponse = z.array(SignalDTO);

function toDTO(row: Signal): z.infer<typeof SignalDTO> {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    unit: row.unit ?? undefined,
    source: row.source,
    confidence: signalConfidenceSchema.parse(row.confidence),
    trend: row.trend ? signalTrendSchema.parse(row.trend) : undefined,
  };
}

/**
 * List signals
 * @description 当前用户的设备/化验信号（含来源与置信度，最新在前）
 * @response SignalListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await signalRepo.listByUser(user.id);
  return NextResponse.json(SignalListResponse.parse(rows.map(toDTO)));
});
