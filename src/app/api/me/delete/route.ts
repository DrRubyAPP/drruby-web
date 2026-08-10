import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { userAccountRepo } from "@/lib/db";
import { DeleteMeResponse } from "../route";
import { handle } from "@/lib/errors";

/**
 * Delete current user
 * @description 软删脱敏当前账号（不可逆）：置 deleted + 脱敏 email/name + 失效 session；不物理删
 * @response DeleteMeResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async () => {
  const user = await requireUser();
  await userAccountRepo.softDeleteAndAnonymize(user.id);
  return NextResponse.json(DeleteMeResponse.parse({ deleted: true }));
});
