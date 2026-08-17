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

describe("clinic appointments (list + create)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("创建后列表可见，且仅本诊所", async () => {
    const me = await makeClinicUser("apt@example.com");
    const patient = await makeUser("apt-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const created = await POST(
      jsonRequest(
        {
          patientUserId: patient.id,
          scheduledAt: new Date().toISOString(),
          note: "x",
        },
        { method: "POST" },
      ),
    );
    expect(created.status).toBe(200);

    const { GET } = await import("./route");
    const list = await GET(bareRequest("GET"));
    const body = await list.json();
    expect(list.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items[0].patientUserId).toBe(patient.id);
  });

  it("status 筛选生效", async () => {
    const me = await makeClinicUser("apt2@example.com");
    const patient = await makeUser("apt2-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const created = await POST(
      jsonRequest(
        { patientUserId: patient.id, scheduledAt: new Date().toISOString() },
        { method: "POST" },
      ),
    );
    const createdId = (await created.json()).id;

    const { PATCH } = await import("./[id]/route");
    const updated = await PATCH(
      jsonRequest({ status: "done" }, { method: "PATCH" }),
      { params: Promise.resolve({ id: createdId }) },
    );
    expect(updated.status).toBe(200);

    const { GET } = await import("./route");
    const done = await GET(
      new Request("http://test/api?status=done"),
    );
    const body = await done.json();
    expect(body.total).toBe(1);

    const scheduled = await GET(
      new Request("http://test/api?status=scheduled"),
    );
    const body2 = await scheduled.json();
    expect(body2.total).toBe(0);
  });
});
