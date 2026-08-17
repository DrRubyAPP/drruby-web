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
} from "@/lib/db/repositories/clinic/invoice.repo";

describe("invoiceRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("listByClinic 按 clinicId 过滤（隔离他诊所数据）", async () => {
    const a = await makeClinicUser("inv-a@example.com");
    const b = await makeClinicUser("inv-b@example.com");
    const patient = await makeUser("inv-p@example.com");
    await create(a.clinicId, { patientUserId: patient.id, amount: 100 });
    await create(b.clinicId, { patientUserId: patient.id, amount: 200 });
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("create 默认 status=draft 且金额序列化为 Decimal", async () => {
    const a = await makeClinicUser("inv-c@example.com");
    const patient = await makeUser("inv-cp@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      amount: 180.5,
      currency: "USD",
    });
    expect(row.status).toBe("draft");
    expect(row.amount.toString()).toBe("180.5");
    expect(row.clinicId).toBe(a.clinicId);
  });

  it("update 置 paidAt（status→paid）", async () => {
    const a = await makeClinicUser("inv-u@example.com");
    const patient = await makeUser("inv-up@example.com");
    const row = await create(a.clinicId, {
      patientUserId: patient.id,
      amount: 50,
    });
    await update(row.id, { status: "sent" });
    const paid = await update(row.id, { status: "paid", paidAt: new Date() });
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).not.toBeNull();
    expect(await findById(row.id)).not.toBeNull();
  });
});
