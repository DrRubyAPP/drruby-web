import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo } from "@/lib/db";
import { checkInFrequencySchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";
import { toDecisionDTO } from "../../../dto";

const bodySchema = z.object({
  baselineText: z.string().min(1),
  baselineRecordId: z.string().optional(),
  freq: checkInFrequencySchema,
});

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/**
 * Start observing
 * @description §27 Start Observing：DECIDED → OBSERVING 原子事务。写 observeBaseline（text/recordId/freq）+ 设 nextCheckInAt=now+freq + 刷 lastUserActivityAt + 写 TimelineEvent。CLOSED/COMPLETED 等终态 422。越权 404
 * @body StartObservingBody
 * @response DecisionDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const body = bodySchema.parse(await req.json());

  try {
    const decision = await decisionRepo.startObserving({
      decisionId: id,
      userId: user.id,
      baselineText: body.baselineText,
      baselineRecordId: body.baselineRecordId,
      freq: body.freq,
    });
    return NextResponse.json(toDecisionDTO(decision, { withBrief: false }));
  } catch (e) {
    throw new AppError(
      "UNPROCESSABLE_ENTITY",
      (e as Error).message,
      422,
    );
  }
});
