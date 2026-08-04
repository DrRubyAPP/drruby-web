import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo, timelineEventRepo } from "@/lib/db";
import { timelineKindSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
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

/** 新增时间线事件入参 */
export const CreateTimelineBody = z.object({
  kind: timelineKindSchema,
  title: z.string().min(1),
  detail: z.string().optional(),
  source: z.string().optional(),
  occurredAt: z.string().optional().describe("发生时间 ISO（缺省 now）"),
  decisionId: z.string().optional().describe("关联决策（须属当前用户）"),
});

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

/**
 * Create timeline event
 * @description 向当前用户的身体时间线追加一条事件（可选关联决策）
 * @body CreateTimelineBody
 * @response TimelineEventDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = CreateTimelineBody.parse(await req.json());

  // 关联决策须属当前用户，否则按不存在处理
  if (body.decisionId) {
    const decision = await decisionRepo.findById(body.decisionId);
    if (!decision || decision.userId !== user.id) {
      throw new AppError("NOT_FOUND", "关联决策不存在", 404);
    }
  }

  const row = await timelineEventRepo.create(user.id, {
    kind: body.kind,
    title: body.title,
    detail: body.detail ?? null,
    source: body.source ?? null,
    decisionId: body.decisionId ?? null,
    occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
  });
  return NextResponse.json(toDTO(row), { status: 201 });
});
