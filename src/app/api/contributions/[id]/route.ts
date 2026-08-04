import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { contributionRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { ContributionDTO } from "../route";

/** 共享/撤回入参（可撤回：true↔false 均可） */
export const UpdateContributionBody = z.object({
  shared: z.boolean().describe("是否共享该数据贡献（可随时撤回）"),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Toggle data contribution sharing
 * @description 切换某条数据贡献的共享状态（opt-in，可撤回）。越权按 404
 * @body UpdateContributionBody
 * @response ContributionDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const row = await contributionRepo.findById(id);
  if (!row || row.userId !== user.id) {
    throw new AppError("NOT_FOUND", "数据贡献不存在", 404);
  }

  const body = UpdateContributionBody.parse(await req.json());
  const updated = await contributionRepo.setShared(id, body.shared);
  return NextResponse.json(
    ContributionDTO.parse({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      shared: updated.shared,
    }),
  );
});
