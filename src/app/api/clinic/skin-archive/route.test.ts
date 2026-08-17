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

describe("clinic skin-archive (list + create)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("创建后列表可见 + 三指标投影", async () => {
    const me = await makeClinicUser("sa-rt@example.com");
    const patient = await makeUser("sa-rtp@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const created = await POST(
      jsonRequest(
        {
          patientUserId: patient.id,
          objectKey: "obj/1.jpg",
          inflammatoryScore: 61,
          pigmentationScore: 48,
          textureScore: 74,
          trend: "improving",
          capturedAt: new Date().toISOString(),
        },
        { method: "POST" },
      ),
    );
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.inflammatoryScore).toBe(61);

    const { GET } = await import("./route");
    const list = await GET(bareRequest("GET"));
    const listBody = await list.json();
    expect(listBody.total).toBe(1);
  });

  it("改他人诊所扫描 → 404", async () => {
    const a = await makeClinicUser("sa-a2@example.com");
    const b = await makeClinicUser("sa-b2@example.com");
    const patient = await makeUser("sa-p2@example.com");
    const repo = await import("@/lib/db/repositories/clinic/skinArchive.repo");
    const scan = await repo.create(a.clinicId, {
      patientUserId: patient.id,
      objectKey: "k",
      capturedAt: new Date(),
    });
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./[id]/route");
    const res = await GET(bareRequest("GET"), params(scan.id));
    expect(res.status).toBe(404);
  });
});
