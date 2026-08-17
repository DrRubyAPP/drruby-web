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

describe("clinic finance (detail + update state machine)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见且金额投影为字符串", async () => {
    const me = await makeClinicUser("fin-det@example.com");
    const patient = await makeUser("fin-det-p@example.com");
    asClinic(me.userId, me.clinicId);
    const invRepo = await import("@/lib/db/repositories/clinic/invoice.repo");
    const inv = await invRepo.create(me.clinicId, {
      patientUserId: patient.id,
      amount: 180,
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(inv.id));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.amount).toBe("180");
  });

  it("改他人诊所发票 → 404", async () => {
    const a = await makeClinicUser("fin-a@example.com");
    const b = await makeClinicUser("fin-b@example.com");
    const patient = await makeUser("fin-ab-p@example.com");
    const invRepo = await import("@/lib/db/repositories/clinic/invoice.repo");
    const inv = await invRepo.create(a.clinicId, {
      patientUserId: patient.id,
      amount: 10,
    });
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(inv.id));
    expect(res.status).toBe(404);
  });

  it("draft → sent → paid 状态机 + 置 issuedAt/paidAt", async () => {
    const me = await makeClinicUser("fin-sm@example.com");
    const patient = await makeUser("fin-sm-p@example.com");
    asClinic(me.userId, me.clinicId);
    const invRepo = await import("@/lib/db/repositories/clinic/invoice.repo");
    const inv = await invRepo.create(me.clinicId, {
      patientUserId: patient.id,
      amount: 300,
    });
    const { PATCH } = await import("./route");
    const sent = await PATCH(
      jsonRequest({ status: "sent" }, { method: "PATCH" }),
      params(inv.id),
    );
    expect((await sent.json()).issuedAt).not.toBeNull();

    const paid = await PATCH(
      jsonRequest({ status: "paid" }, { method: "PATCH" }),
      params(inv.id),
    );
    expect((await paid.json()).paidAt).not.toBeNull();
  });

  it("非法跃迁 draft → paid → 422", async () => {
    const me = await makeClinicUser("fin-422@example.com");
    const patient = await makeUser("fin-422-p@example.com");
    asClinic(me.userId, me.clinicId);
    const invRepo = await import("@/lib/db/repositories/clinic/invoice.repo");
    const inv = await invRepo.create(me.clinicId, {
      patientUserId: patient.id,
      amount: 99,
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ status: "paid" }, { method: "PATCH" }),
      params(inv.id),
    );
    expect(res.status).toBe(422);
  });
});
