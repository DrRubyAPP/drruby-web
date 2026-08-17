import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";
import {
  create,
  listByClinic,
  update,
} from "@/lib/db/repositories/clinic/skinArchive.repo";

describe("skinArchiveRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 按 clinicId 过滤", async () => {
    const a = await makeClinicUser("sa-a@example.com");
    const b = await makeClinicUser("sa-b@example.com");
    const patient = await makeUser("sa-p@example.com");
    await create(a.clinicId, {
      patientUserId: patient.id,
      objectKey: "k1",
      capturedAt: new Date(),
    });
    await create(b.clinicId, {
      patientUserId: patient.id,
      objectKey: "k2",
      capturedAt: new Date(),
    });
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("create 写入三指标 + trend", async () => {
    const a = await makeClinicUser("sa-c@example.com");
    const patient = await makeUser("sa-cp@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      objectKey: "k",
      inflammatoryScore: 61,
      pigmentationScore: 48,
      textureScore: 74,
      trend: "improving",
      capturedAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(Number(row.inflammatoryScore)).toBe(61);
    expect(row.trend).toBe("improving");
  });

  it("update 改 trend", async () => {
    const a = await makeClinicUser("sa-u@example.com");
    const patient = await makeUser("sa-up@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      objectKey: "k",
      capturedAt: new Date(),
    });
    const updated = await update(row.id, { trend: "declining" });
    expect(updated.trend).toBe("declining");
  });
});
