import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSynthesizer,
  RegenerationOrchestrator,
} from "@/lib/ai/synthesis";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo, decisionSnapshotRepo } from "@/lib/db";
import { changeTriggerSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

async function assertDecisionOwner(userId: string, decisionId: string) {
  const existing = await decisionRepo.findById(decisionId);
  if (!existing || existing.userId !== userId) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }
  return existing;
}

/** POST /regenerate 入参：显式 trigger（默认 new_record）；可传 corpusVersionChanged */
export const RegenerateBody = z.object({
  trigger: changeTriggerSchema.default("new_record"),
  corpusVersionChanged: z.boolean().optional(),
});

/**
 * Trigger regeneration
 * @description §18/§22 手动触发 regeneration（D2+D4+D1 全链路）。若 currentSnapshotId=null 则建首版（R1）。返回是否 material + 新 snapshot id。越权 404
 * @body RegenerateBody
 * @response { material: boolean, snapshotId?: string, reason?: string }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await assertDecisionOwner(user.id, id);

  const body = RegenerateBody.parse(await req.json());

  const orch = new RegenerationOrchestrator({
    synthesizer: createSynthesizer(),
  });

  // R1：currentSnapshotId=null → 建首版
  const current = await decisionSnapshotRepo.findCurrent(id);
  if (!current) {
    const init = await orch.runInitialSynthesis(id);
    return NextResponse.json({
      material: true,
      snapshotId: init.snapshotId,
      reason: "initial synthesis",
    });
  }

  // 已有 Current → 触发 regeneration（D4 material 判定）
  const result = await orch.runRegeneration(id, {
    trigger: body.trigger,
    corpusVersionChanged: body.corpusVersionChanged,
  });
  return NextResponse.json(result);
});
