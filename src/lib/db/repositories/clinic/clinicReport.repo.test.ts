import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";
import {
  create,
  findById,
  listByClinic,
  update,
} from "@/lib/db/repositories/clinic/clinicReport.repo";

describe("clinicReportRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 按 clinicId 过滤（隔离他诊所数据）", async () => {
    const a = await makeClinicUser("rpt-a@example.com");
    const b = await makeClinicUser("rpt-b@example.com");
    const patient = await makeUser("rpt-p@example.com");
    await create(a.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "x" },
    });
    await create(b.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "y" },
    });
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("create 默认 status=ai_drafted", async () => {
    const a = await makeClinicUser("rpt-c@example.com");
    const patient = await makeUser("rpt-cp@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "draft" },
    });
    expect(row.status).toBe("ai_drafted");
    expect(row.clinicId).toBe(a.clinicId);
  });

  it("update 推进到 in_review 并记录 reviewerUserId", async () => {
    const a = await makeClinicUser("rpt-u@example.com");
    const patient = await makeUser("rpt-up@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "d" },
    });
    const updated = await update(row.id, {
      status: "in_review",
      reviewerUserId: a.userId,
    });
    expect(updated.status).toBe("in_review");
    expect(updated.reviewerUserId).toBe(a.userId);
    expect(await findById(row.id)).not.toBeNull();
  });
});
