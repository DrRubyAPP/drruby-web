import type { PageParams, PageResult } from "@/lib/api/pagination";
import { prisma } from "@/lib/db/prisma";
import type { UserAccount } from "~prisma/client";

/** 患者派生视图状态：有未来预约 → active；否则有授权 → pending；否则 new。 */
export type PatientStatus = "active" | "pending" | "new";

export interface PatientProjection {
  id: string;
  name: string | null;
  email: string;
  ageRange: string | null;
  concern: string | null;
  lastScan: string | null;
  indices: {
    inflammation: number | null;
    pigmentation: number | null;
    texture: number | null;
  };
  authStatus: string | null;
  status: PatientStatus;
  nextAppointment: string | null;
}

export interface ListPatientFilter {
  authStatus?: string;
  status?: PatientStatus;
  q?: string;
}

/** 本诊所「患者」候选集 = Authorization(clinicId) ∪ Appointment(clinicId) ∪ SkinArchive(clinicId) 的 userId 去重。 */
async function candidateIds(clinicId: string): Promise<string[]> {
  const [auth, appt, skin] = await Promise.all([
    prisma.authorization.findMany({
      where: { clinicId },
      select: { userId: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId },
      select: { patientUserId: true },
    }),
    prisma.skinArchive.findMany({
      where: { clinicId },
      select: { patientUserId: true },
    }),
  ]);
  const set = new Set<string>();
  for (const a of auth) set.add(a.userId);
  for (const a of appt) set.add(a.patientUserId);
  for (const s of skin) set.add(s.patientUserId);
  return [...set];
}

/** 把单个 UserAccount 投影为 PatientProjection（关联 clinicId 维度的授权/扫描/预约）。 */
async function project(
  clinicId: string,
  user: UserAccount,
): Promise<PatientProjection> {
  const [baseline, latestScan, auth, next] = await Promise.all([
    prisma.userBaseline.findUnique({ where: { userId: user.id } }),
    prisma.skinArchive.findFirst({
      where: { clinicId, patientUserId: user.id },
      orderBy: { capturedAt: "desc" },
    }),
    prisma.authorization.findFirst({
      where: { clinicId, userId: user.id },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.appointment.findFirst({
      where: {
        clinicId,
        patientUserId: user.id,
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const authStatus = auth?.status ?? null;
  const status: PatientStatus = next
    ? "active"
    : authStatus === "active"
      ? "pending"
      : "new";

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // user_baseline 无 ageRange 字段，按实暴露 null
    ageRange: null,
    concern: baseline?.concernGoals?.length
      ? baseline.concernGoals.join(", ")
      : null,
    lastScan: latestScan ? latestScan.capturedAt.toISOString() : null,
    indices: {
      inflammation: latestScan?.inflammatoryScore
        ? Number(latestScan.inflammatoryScore)
        : null,
      pigmentation: latestScan?.pigmentationScore
        ? Number(latestScan.pigmentationScore)
        : null,
      texture: latestScan?.textureScore
        ? Number(latestScan.textureScore)
        : null,
    },
    authStatus,
    status,
    nextAppointment: next ? next.scheduledAt.toISOString() : null,
  };
}

/**
 * 列出本诊所患者（派生只读视图）。
 * 患者集以候选 userId 取 UserAccount，再 enrich + 内存过滤 authStatus/status（诊所患者量小，
 * 内存分页足够且保证 total 准确）。
 */
export async function listByClinic(
  clinicId: string,
  pp: PageParams,
  filter: ListPatientFilter = {},
): Promise<PageResult<PatientProjection>> {
  const ids = await candidateIds(clinicId);
  const where: Record<string, unknown> = { id: { in: ids }, deletedAt: null };
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { email: { contains: filter.q, mode: "insensitive" } },
    ];
  }
  const users = await prisma.userAccount.findMany({
    where,
    orderBy: { name: "asc" },
  });
  const projected = await Promise.all(users.map((u) => project(clinicId, u)));
  const filtered = projected.filter((p) => {
    if (filter.authStatus && p.authStatus !== filter.authStatus) return false;
    if (filter.status && p.status !== filter.status) return false;
    return true;
  });
  const total = filtered.length;
  const start = (pp.page - 1) * pp.pageSize;
  const items = filtered.slice(start, start + pp.pageSize);
  return { items, total, page: pp.page, pageSize: pp.pageSize };
}

export interface PatientDetail extends PatientProjection {
  authorizations: {
    id: string;
    scopes: string[];
    status: string;
    grantedAt: string;
    revokedAt: string | null;
  }[];
  recentScans: {
    id: string;
    capturedAt: string;
    inflammation: number | null;
    pigmentation: number | null;
    texture: number | null;
    trend: string | null;
  }[];
}

/** 患者详情（只读派生视图）；非本诊所患者 → null（调用方转 404）。 */
export async function findDetail(
  clinicId: string,
  patientUserId: string,
): Promise<PatientDetail | null> {
  const user = await prisma.userAccount.findUnique({
    where: { id: patientUserId, deletedAt: null },
  });
  if (!user) return null;
  const ids = await candidateIds(clinicId);
  if (!ids.includes(patientUserId)) return null;

  const base = await project(clinicId, user);
  const [authorizations, recentScans] = await Promise.all([
    prisma.authorization.findMany({
      where: { clinicId, userId: patientUserId },
      orderBy: { grantedAt: "desc" },
    }),
    prisma.skinArchive.findMany({
      where: { clinicId, patientUserId: patientUserId },
      orderBy: { capturedAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    ...base,
    authorizations: authorizations.map((a) => ({
      id: a.id,
      scopes: a.scopes,
      status: a.status,
      grantedAt: a.grantedAt.toISOString(),
      revokedAt: a.revokedAt ? a.revokedAt.toISOString() : null,
    })),
    recentScans: recentScans.map((s) => ({
      id: s.id,
      capturedAt: s.capturedAt.toISOString(),
      inflammation: s.inflammatoryScore ? Number(s.inflammatoryScore) : null,
      pigmentation: s.pigmentationScore ? Number(s.pigmentationScore) : null,
      texture: s.textureScore ? Number(s.textureScore) : null,
      trend: s.trend ?? null,
    })),
  };
}
