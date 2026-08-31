import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionEntryRepo, decisionRepo } from "@/lib/db";
import { observationDirectionSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { toEntryDTO } from "../../../dto";

/** §28 Observation synthesis 附件结构（与 POST 端点一致） */
const observationSynthesisSchema = z.object({
  photos: z
    .array(z.object({ recordId: z.string(), summary: z.string().optional() }))
    .optional(),
  recordRefs: z
    .array(z.object({ recordId: z.string(), summary: z.string().optional() }))
    .optional(),
});

const updateBodySchema = z.object({
  text: z.string().min(1).optional(),
  /** direction 非必填，可显式 null 清空 */
  direction: observationDirectionSchema.nullable().optional(),
  synthesis: observationSynthesisSchema.optional(),
});

type Ctx = { params: Promise<{ id: string; entryId: string }> };

async function assertDecisionOwner(
  userId: string,
  decisionId: string,
): Promise<void> {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
}

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
 * Update observation
 * @description §28/D8 修正 Observation：append-only 原则下保留 occurredAt/createdAt 不变，仅更新 direction/text/synthesis。route 层预检 entryId 属于该 decision + 用户。修正属 meaningful activity，刷 lastUserActivityAt（§8）。越权 404
 * @body UpdateObservationBody
 * @response EntryResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id, entryId } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  // 校验 entryId 属于该 decision（避免跨 decision 改 entry）
  const observations = await decisionEntryRepo.listByDecisionAndKind(
    id,
    "observation",
  );
  if (!observations.some((e) => e.id === entryId)) {
    throw new AppError("NOT_FOUND", "观察条目不存在", 404);
  }

  const body = updateBodySchema.parse(await req.json());
  const entry = await decisionEntryRepo.updateObservation({
    entryId,
    userId: user.id,
    text: body.text,
    direction: body.direction,
    synthesis: body.synthesis
      ? normalizeSynthesis(body.synthesis)
      : undefined,
  });
  return NextResponse.json(toEntryDTO(entry));
});
