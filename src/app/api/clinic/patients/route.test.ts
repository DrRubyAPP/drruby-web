import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  makeClinicUser,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

describe("clinic patients (list + detail)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("列表含本诊所授权患者", async () => {
    const me = await makeClinicUser("clinic-rt@example.com");
    const patient = await makeUser("patient-rt@example.com");
    await prisma.authorization.create({
      data: { clinicId: me.clinicId, userId: patient.id, scopes: ["skin_archive"], status: "active", grantedAt: new Date() },
    });
    asClinic(me.userId, me.clinicId);

    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].id).toBe(patient.id);
  });

  it("详情可见，非本诊所患者 → 404", async () => {
    const me = await makeClinicUser("clinic-rt2@example.com");
    const other = await makeClinicUser("clinic-rt3@example.com");
    const patient = await makeUser("patient-rt2@example.com");
    await prisma.authorization.create({
      data: { clinicId: me.clinicId, userId: patient.id, scopes: ["skin_archive"], status: "active", grantedAt: new Date() },
    });
    asClinic(me.userId, me.clinicId);

    const { GET } = await import("./[id]/route");
    const ok = await GET(bareRequest("GET"), params(patient.id));
    expect(ok.status).toBe(200);

    asClinic(other.userId, other.clinicId);
    const hidden = await GET(bareRequest("GET"), params(patient.id));
    expect(hidden.status).toBe(404);
  });
});
