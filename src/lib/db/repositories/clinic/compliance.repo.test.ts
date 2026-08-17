import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  findDetail,
  listAuthorizations,
  revoke,
} from "@/lib/db/repositories/clinic/compliance.repo";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

describe("complianceRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listAuthorizations 按 clinicId 过滤", async () => {
    const a = await makeClinicUser("cmp-a@example.com");
    const b = await makeClinicUser("cmp-b@example.com");
    const patient = await makeUser("cmp-p@example.com");
    await prisma.authorization.create({
      data: {
        userId: patient.id,
        clinicId: a.clinicId,
        scopes: ["skin_archive"],
        status: "active",
        grantedAt: new Date(),
      },
    });
    await prisma.authorization.create({
      data: {
        userId: patient.id,
        clinicId: b.clinicId,
        scopes: ["skin_archive"],
        status: "active",
        grantedAt: new Date(),
      },
    });
    const res = await listAuthorizations(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("findDetail 含审计流水；非本诊所 → null", async () => {
    const a = await makeClinicUser("cmp-d@example.com");
    const b = await makeClinicUser("cmp-e@example.com");
    const patient = await makeUser("cmp-dp@example.com");
    const auth = await prisma.authorization.create({
      data: {
        userId: patient.id,
        clinicId: a.clinicId,
        scopes: ["skin_archive"],
        status: "active",
        grantedAt: new Date(),
      },
    });
    await prisma.authorizationAudit.create({
      data: {
        authorizationId: auth.id,
        action: "granted",
        actorUserId: a.userId,
      },
    });
    const detail = await findDetail(a.clinicId, auth.id);
    expect(detail).not.toBeNull();
    expect(detail?.audit.length).toBe(1);
    expect(await findDetail(b.clinicId, auth.id)).toBeNull();
  });

  it("revoke 置 revoked + 追加审计", async () => {
    const a = await makeClinicUser("cmp-r@example.com");
    const patient = await makeUser("cmp-rp@example.com");
    const auth = await prisma.authorization.create({
      data: {
        userId: patient.id,
        clinicId: a.clinicId,
        scopes: ["skin_archive"],
        status: "active",
        grantedAt: new Date(),
      },
    });
    const updated = await revoke(a.clinicId, auth.id, a.userId);
    expect(updated.status).toBe("revoked");
    expect(updated.revokedAt).not.toBeNull();
    const detail = await findDetail(a.clinicId, auth.id);
    expect(detail?.audit.some((x) => x.action === "revoked")).toBe(true);
  });
});
