import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeClinicUser,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

async function seedAuth(clinicId: string, userId: string, status = "active") {
  return prisma.authorization.create({
    data: {
      userId,
      clinicId,
      scopes: ["skin_archive"],
      status,
      grantedAt: new Date(),
    },
  });
}

describe("clinic compliance (detail + revoke)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见 + 含审计", async () => {
    const me = await makeClinicUser("cmp-det@example.com");
    const patient = await makeUser("cmp-det-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const auth = await seedAuth(me.clinicId, patient.id);
    await prisma.authorizationAudit.create({
      data: {
        authorizationId: auth.id,
        action: "granted",
        actorUserId: me.userId,
      },
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(auth.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(auth.id);
    expect(body.audit.length).toBe(1);
  });

  it("改他人诊所授权 → 404", async () => {
    const a = await makeClinicUser("cmp-a@example.com");
    const b = await makeClinicUser("cmp-b@example.com");
    const patient = await makeUser("cmp-det-patient2@example.com");
    const auth = await seedAuth(a.clinicId, patient.id);
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(auth.id));
    expect(res.status).toBe(404);
  });

  it("PATCH 撤销写 AuthorizationAudit", async () => {
    const me = await makeClinicUser("cmp-patch@example.com");
    const patient = await makeUser("cmp-patch-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const auth = await seedAuth(me.clinicId, patient.id);
    const { PATCH } = await import("./route");
    const res = await PATCH(bareRequest("PATCH"), params(auth.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("revoked");
    expect(
      body.audit.some((x: { action: string }) => x.action === "revoked"),
    ).toBe(true);
  });

  it("已撤销再撤销 → 422", async () => {
    const me = await makeClinicUser("cmp-422@example.com");
    const patient = await makeUser("cmp-422-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const auth = await seedAuth(me.clinicId, patient.id, "revoked");
    const { PATCH } = await import("./route");
    const res = await PATCH(bareRequest("PATCH"), params(auth.id));
    expect(res.status).toBe(422);
  });
});
