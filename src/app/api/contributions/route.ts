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

/** 创建匿名贡献入参（title/description 必填；shared 默认 false） */
export const CreateContributionBody = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  shared: z.boolean().optional().default(false),
});

/**
 * Create data contribution
 * @description 提交一条数据贡献（用户私有记录，默认不公开；shared=true 表示愿意公开，审核转 Journey 是后续链路）
 * @body CreateContributionBody
 * @response ContributionDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = CreateContributionBody.parse(await req.json());
  const row = await contributionRepo.create(user.id, body);
  return NextResponse.json(ContributionDTO.parse(toDTO(row)), { status: 201 });
});
