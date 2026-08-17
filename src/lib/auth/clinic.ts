import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";

export interface ClinicUser {
  id: string;
  clinicId: string;
  role: string;
}

/**
 * 诊所门户统一鉴权入口：先校验 role=clinic（task-11），再经 ClinicStaff
 * 解析其所属诊所 clinicId（单诊所假设取第一条）。所有诊所端点必须先过此函数，
 * 后续查询按返回的 clinicId 过滤，形成「角色守卫 + 归属校验」双保险。
 */
export async function requireClinicUser(): Promise<ClinicUser> {
  const user = await requireRole("clinic");
  const staff = await prisma.clinicStaff.findFirst({
    where: { userId: user.id },
    select: { clinicId: true },
  });
  if (!staff) {
    throw new AppError("FORBIDDEN", "未关联诊所", 403);
  }
  return { id: user.id, clinicId: staff.clinicId, role: user.role ?? "clinic" };
}
