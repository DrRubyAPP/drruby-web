import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("clinic treatments (list + create)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("列表按 clinicId 隔离 + 投影患者名", async () => {
    const me = await makeClinicUser("list@example.com");
    const patient = await makeUser("list-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/treatment.repo");
    await repo.create(me.clinicId, {
      patientUserId: patient.id,
      name: "T",
    });

    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].patientName).toBeNull();
  });

  it("POST 建治疗默认 planned", async () => {
    const me = await makeClinicUser("post@example.com");
    const patient = await makeUser("post-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const res = await POST(
      jsonRequest({
        patientUserId: patient.id,
        name: "Botox",
        type: "botox",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("planned");
    expect(body.type).toBe("botox");
  });
});
