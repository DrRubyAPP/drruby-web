import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

describe("clinic crm (list + create)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("列表按 clinicId 隔离", async () => {
    const me = await makeClinicUser("c-list@example.com");
    const patient = await makeUser("c-list-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/crmActivity.repo");
    await repo.create(me.clinicId, {
      patientUserId: patient.id,
      type: "call",
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].type).toBe("call");
  });

  it("POST 建活动默认 open", async () => {
    const me = await makeClinicUser("c-post@example.com");
    const patient = await makeUser("c-post-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const res = await POST(
      jsonRequest({ patientUserId: patient.id, type: "email" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("open");
    expect(body.type).toBe("email");
  });
});
