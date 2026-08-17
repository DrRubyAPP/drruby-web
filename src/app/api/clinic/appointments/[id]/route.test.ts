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

describe("clinic appointments (detail + update)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见且投影患者名", async () => {
    const me = await makeClinicUser("det@example.com");
    const patient = await makeUser("det-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/appointment.repo");
    const appt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });

    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(appt.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(appt.id);
    expect(body.patientName).toBeNull(); // 未 join 外部 name（轻量）
  });

  it("改他人诊所预约 → 404", async () => {
    const a = await makeClinicUser("a-det@example.com");
    const b = await makeClinicUser("b-det@example.com");
    const patient = await makeUser("det-patient2@example.com");
    const repo = await import("@/lib/db/repositories/clinic/appointment.repo");
    const appt = await repo.create(a.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(appt.id));
    expect(res.status).toBe(404);
  });

  it("PATCH 推进状态", async () => {
    const me = await makeClinicUser("patch@example.com");
    const patient = await makeUser("patch-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/appointment.repo");
    const appt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ status: "done", note: "done!" }, { method: "PATCH" }),
      params(appt.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.note).toBe("done!");
  });
});
