import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { experimentRepo } from "@/lib/db";
import { experimentStatusSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";
import type { Experiment } from "~prisma/client";

/** App `types.ts` Experiment */
export const ExperimentDTO = z.object({
  id: z.string(),
  title: z.string(),
  hypothesis: z.string(),
  status: experimentStatusSchema,
  window: z.string(),
});
export const ExperimentListResponse = z.array(ExperimentDTO);

/** 新增实验入参 */
export const CreateExperimentBody = z.object({
  title: z.string().min(1),
  hypothesis: z.string().min(1),
  status: experimentStatusSchema,
  window: z.string().min(1),
});

function toDTO(row: Experiment): z.infer<typeof ExperimentDTO> {
  return {
    id: row.id,
    title: row.title,
    hypothesis: row.hypothesis,
    status: experimentStatusSchema.parse(row.status),
    window: row.window,
  };
}

/**
 * List experiments
 * @description 当前用户的 N-of-1 实验（最新在前）
 * @response ExperimentListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await experimentRepo.listByUser(user.id);
  return NextResponse.json(ExperimentListResponse.parse(rows.map(toDTO)));
});

/**
 * Create experiment
 * @description 为当前用户创建一个 N-of-1 实验
 * @body CreateExperimentBody
 * @response ExperimentDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = CreateExperimentBody.parse(await req.json());
  const row = await experimentRepo.create(user.id, {
    title: body.title,
    hypothesis: body.hypothesis,
    status: body.status,
    window: body.window,
  });
  return NextResponse.json(toDTO(row), { status: 201 });
});
