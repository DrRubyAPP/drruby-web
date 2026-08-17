import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  create,
  findById,
  listByClinic,
  update,
} from "@/lib/db/repositories/clinic/crmActivity.repo";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

describe("crmActivityRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 按 clinicId 过滤（隔离他诊所数据）", async () => {
    const a = await makeClinicUser("crm-a@example.com");
    const b = await makeClinicUser("crm-b@example.com");
    const patient = await makeUser("crm-p@example.com");
    await create(a.clinicId, { patientUserId: patient.id, type: "call" });
    await create(b.clinicId, { patientUserId: patient.id, type: "email" });
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("create 默认 status=open", async () => {
    const a = await makeClinicUser("crm-c@example.com");
    const patient = await makeUser("crm-cp@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      type: "note",
    });
    expect(row.status).toBe("open");
    expect(row.type).toBe("note");
    expect(row.clinicId).toBe(a.clinicId);
  });

  it("update 写状态 + 备注", async () => {
    const a = await makeClinicUser("crm-u@example.com");
    const patient = await makeUser("crm-up@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      type: "follow_up",
    });
    await update(row.id, { status: "done", note: "done!" });
    const updated = await findById(row.id);
    expect(updated?.status).toBe("done");
    expect(updated?.note).toBe("done!");
  });
});
