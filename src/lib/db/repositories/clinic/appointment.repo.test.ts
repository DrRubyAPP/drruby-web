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
} from "@/lib/db/repositories/clinic/appointment.repo";

describe("appointmentRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 按 clinicId 过滤（隔离他诊所数据）", async () => {
    const a = await makeClinicUser("a@example.com");
    const b = await makeClinicUser("b@example.com");
    const patient = await makeUser("p@example.com");
    await create(a.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });
    await create(b.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("create 默认 status=scheduled 并归属 clinicId", async () => {
    const a = await makeClinicUser("a@example.com");
    const patient = await makeUser("p@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(row.status).toBe("scheduled");
    expect(row.clinicId).toBe(a.clinicId);
  });

  it("update 推进状态与备注", async () => {
    const a = await makeClinicUser("a@example.com");
    const patient = await makeUser("p@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      scheduledAt: new Date(),
    });
    const updated = await update(row.id, { status: "done", note: "completed" });
    expect(updated.status).toBe("done");
    expect(updated.note).toBe("completed");
  });
});
