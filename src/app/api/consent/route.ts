import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { consentSettingRepo } from "@/lib/db";
import { handle } from "@/lib/errors";
import type { ConsentSetting } from "~prisma/client";

/** App `types.ts` ConsentSetting */
export const ConsentSettingDTO = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  value: z.boolean(),
  locked: z.boolean().optional(),
});
export const ConsentListResponse = z.array(ConsentSettingDTO);

function toDTO(row: ConsentSetting): z.infer<typeof ConsentSettingDTO> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    value: row.value,
    locked: row.locked,
  };
}

/**
 * List consent settings
 * @description 当前用户的三档隐私开关（self 档 locked 永开）
 * @response ConsentListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await consentSettingRepo.listByUser(user.id);
  return NextResponse.json(ConsentListResponse.parse(rows.map(toDTO)));
});
