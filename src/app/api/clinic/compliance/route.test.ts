import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

describe("clinic compliance (list)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("列表按 clinicId 隔离 + 投影患者名", async () => {
    const me = await makeClinicUser("cmp-list@example.com");
    const patient = await makeUser("cmp-list-patient@example.com");
    asClinic(me.userId, me.clinicId);
    await prisma.authorization.create({
      data: {
        userId: patient.id,
        clinicId: me.clinicId,
        scopes: ["skin_archive"],
        status: "active",
        grantedAt: new Date(),
      },
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].patientUserId).toBe(patient.id);
  });
});
