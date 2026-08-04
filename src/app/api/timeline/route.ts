import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { timelineEventRepo } from "@/lib/db";
import { timelineKindSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { TimelineEvent } from "~prisma/client";

/** App `types.ts` TimelineEvent（`date ← occurredAt`） */
export const TimelineEventDTO = z.object({
  id: z.string(),
  date: z.string(),
  kind: timelineKindSchema,
  title: z.string(),
  detail: z.string().optional(),
  source: z.string().optional(),
});
export const TimelineListResponse = z.array(TimelineEventDTO);

function toDTO(row: TimelineEvent): z.infer<typeof TimelineEventDTO> {
  return {
    id: row.id,
    date: row.occurredAt.toISOString(),
    kind: timelineKindSchema.parse(row.kind),
    title: row.title,
    detail: row.detail ?? undefined,
    source: row.source ?? undefined,
  };
}

/**
 * List timeline events
 * @description 当前用户的身体时间线（快速记录/上传/决策快照，最新在前）
 * @response TimelineListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await timelineEventRepo.listByUser(user.id);
  return NextResponse.json(TimelineListResponse.parse(rows.map(toDTO)));
});
