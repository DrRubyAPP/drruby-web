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

describe("clinic skin-archive (detail + update)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见", async () => {
    const me = await makeClinicUser("sa-d@example.com");
    const patient = await makeUser("sa-dp@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/skinArchive.repo");
    const scan = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      objectKey: "k",
      capturedAt: new Date(),
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(scan.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(scan.id);
  });

  it("PATCH 改 trend", async () => {
    const me = await makeClinicUser("sa-pu@example.com");
    const patient = await makeUser("sa-pup@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/skinArchive.repo");
    const scan = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      objectKey: "k",
      capturedAt: new Date(),
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ trend: "stable" }, { method: "PATCH" }),
      params(scan.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trend).toBe("stable");
  });
});
