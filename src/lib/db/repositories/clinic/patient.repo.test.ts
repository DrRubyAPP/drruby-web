import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";
import { findDetail, listByClinic } from "@/lib/db/repositories/clinic/patient.repo";

async function authorize(clinicId: string, userId: string) {
  return prisma.authorization.create({
    data: { clinicId, userId, scopes: ["skin_archive"], status: "active", grantedAt: new Date() },
  });
}

describe("patientRepo (derived, read-only)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 聚合 Authorization 关联患者", async () => {
    const me = await makeClinicUser("clinic-p@example.com");
    const patient = await makeUser("patient-p@example.com");
    await authorize(me.clinicId, patient.id);

    const res = await listByClinic(me.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].id).toBe(patient.id);
    expect(res.items[0].authStatus).toBe("active");
  });

  it("authStatus 筛选生效", async () => {
    const me = await makeClinicUser("clinic-p2@example.com");
    const patient = await makeUser("patient-p2@example.com");
    await authorize(me.clinicId, patient.id);

    const active = await listByClinic(me.clinicId, { page: 1, pageSize: 20 }, { authStatus: "active" });
    expect(active.total).toBe(1);
    const revoked = await listByClinic(me.clinicId, { page: 1, pageSize: 20 }, { authStatus: "revoked" });
    expect(revoked.total).toBe(0);
  });

  it("findDetail 返回投影 + 授权，非本诊所患者 → null", async () => {
    const me = await makeClinicUser("clinic-p3@example.com");
    const other = await makeClinicUser("clinic-p4@example.com");
    const patient = await makeUser("patient-p3@example.com");
    await authorize(me.clinicId, patient.id);

    const detail = await findDetail(me.clinicId, patient.id);
    expect(detail).not.toBeNull();
    expect(detail?.authorizations.length).toBe(1);

    // 用另一诊所查询 → 该患者不属其候选集 → null（route 转 404）
    const hidden = await findDetail(other.clinicId, patient.id);
    expect(hidden).toBeNull();
  });
});
