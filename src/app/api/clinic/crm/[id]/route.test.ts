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

describe("clinic crm (detail + update)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见", async () => {
    const me = await makeClinicUser("c-det@example.com");
    const patient = await makeUser("c-det-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/crmActivity.repo");
    const act = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      type: "note",
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(act.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(act.id);
  });

  it("改他人诊所活动 → 404", async () => {
    const a = await makeClinicUser("c-a@example.com");
    const b = await makeClinicUser("c-b@example.com");
    const patient = await makeUser("c-det-patient2@example.com");
    const repo = await import("@/lib/db/repositories/clinic/crmActivity.repo");
    const act = await repo.create(a.clinicId, {
      patientUserId: patient.id,
      type: "note",
    });
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(act.id));
    expect(res.status).toBe(404);
  });

  it("PATCH 改状态", async () => {
    const me = await makeClinicUser("c-patch@example.com");
    const patient = await makeUser("c-patch-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/crmActivity.repo");
    const act = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      type: "follow_up",
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ status: "done", note: "done!" }, { method: "PATCH" }),
      params(act.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.note).toBe("done!");
  });
});
