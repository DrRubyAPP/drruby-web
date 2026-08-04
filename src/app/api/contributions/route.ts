import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { contributionRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import type { Contribution } from "~prisma/client";

/** App `types.ts` Contribution */
export const ContributionDTO = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  shared: z.boolean(),
});
export const ContributionListResponse = z.array(ContributionDTO);

function toDTO(row: Contribution): z.infer<typeof ContributionDTO> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    shared: row.shared,
  };
}

/**
 * List data contributions
 * @description 当前用户的数据贡献（opt-in，可撤回，最新在前）
 * @response ContributionListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await contributionRepo.listByUser(user.id);
  return NextResponse.json(ContributionListResponse.parse(rows.map(toDTO)));
});
