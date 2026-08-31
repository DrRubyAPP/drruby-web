import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionEntryRepo, decisionRepo } from "@/lib/db";
import { observationDirectionSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import type { Decision } from "~prisma/client";
import { toEntryDTO } from "../../dto";

/** §28 Observation synthesis 附件结构（kind=observation 专属） */
const observationSynthesisSchema = z.object({
  photos: z
    .array(z.object({ recordId: z.string(), summary: z.string().optional() }))
    .optional(),
  recordRefs: z
    .array(z.object({ recordId: z.string(), summary: z.string().optional() }))
    .optional(),
});

const createBodySchema = z.object({
  text: z.string().min(1),
  direction: observationDirectionSchema.optional(),
  synthesis: observationSynthesisSchema.optional(),
  occurredAt: z.string().datetime().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

/** 复用 decision ownership 预检（与 /api/decisions/[id] 一致） */
async function assertDecisionOwner(
  userId: string,
  decisionId: string,
): Promise<Decision> {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/** 把 zod 解析后的 synthesis 形态归一为 repo 期望的 ObservationSynthesis */
function normalizeSynthesis(body: {
  photos?: { recordId: string; summary?: string }[];
  recordRefs?: { recordId: string; summary?: string }[];
}): {
  photos: { recordId: string; summary?: string }[];
  recordRefs: { recordId: string; summary?: string }[];
} {
  return {
    photos: body.photos ?? [],
    recordRefs: body.recordRefs ?? [],
  };
}

/**
 * Create observation
 * @description §28 check-in Observation：direction 四态（非必填）+ 文本 + synthesis {photos, recordRefs}。仅 OBSERVING 状态可提交（route 预检）。append-only：保存一条 Observation 不创建新 Decision。顺延 nextCheckInAt（按 observeBaseline.freq）。刷 lastUserActivityAt（§8）。越权 404
 * @body CreateObservationBody
 * @response EntryResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const decision = await assertDecisionOwner(user.id, id);

  if (decision.lifecycle !== "OBSERVING") {
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      "仅 OBSERVING 决策可追加观察",
      422,
    );
  }

  const body = createBodySchema.parse(await req.json());
  const entry = await decisionEntryRepo.createObservation({
    decisionId: id,
    userId: user.id,
    text: body.text,
    direction: body.direction,
    synthesis: body.synthesis ? normalizeSynthesis(body.synthesis) : undefined,
    occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
  });
  return NextResponse.json(toEntryDTO(entry), { status: 201 });
});

/**
 * List observations
 * @description §28 列出 Decision 的所有 observation entries（按 occurredAt 升序）。越权 404
 * @response { observations: EntryResponse[] }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const observations = await decisionEntryRepo.listByDecisionAndKind(
    id,
    "observation",
  );
  return NextResponse.json({
    observations: observations.map(toEntryDTO),
  });
});
