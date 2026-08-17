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

describe("clinic finance (list + create)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("开出发票后列表可见，默认 draft", async () => {
    const me = await makeClinicUser("fin@example.com");
    const patient = await makeUser("fin-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const created = await POST(
      jsonRequest(
        { patientUserId: patient.id, amount: 220 },
        { method: "POST" },
      ),
    );
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.status).toBe("draft");
    expect(body.amount).toBe("220");

    const { GET } = await import("./route");
    const list = await GET(bareRequest("GET"));
    const listBody = await list.json();
    expect(listBody.total).toBe(1);
    expect(listBody.items[0].patientUserId).toBe(patient.id);
  });

  it("status 筛选生效", async () => {
    const me = await makeClinicUser("fin2@example.com");
    const patient = await makeUser("fin2-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const invRepo = await import("@/lib/db/repositories/clinic/invoice.repo");
    await invRepo.create(me.clinicId, {
      patientUserId: patient.id,
      amount: 100,
    });
    const paid = await invRepo.create(me.clinicId, {
      patientUserId: patient.id,
      amount: 100,
    });
    await invRepo.update(paid.id, { status: "paid", paidAt: new Date() });

    const { GET } = await import("./route");
    const paidList = await GET(new Request("http://test/api?status=paid"));
    expect((await paidList.json()).total).toBe(1);
    const draftList = await GET(new Request("http://test/api?status=draft"));
    expect((await draftList.json()).total).toBe(1);
  });
});
