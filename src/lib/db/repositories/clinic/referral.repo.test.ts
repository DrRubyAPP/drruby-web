import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";
import {
  findById,
  listByClinic,
  update,
} from "@/lib/db/repositories/clinic/referral.repo";

describe("referralRepo", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  async function seed(clinicId: string, fromUserId: string, status = "pending") {
    return prisma.referral.create({
      data: { clinicId, fromUserId, status, requestedService: "botox" },
    });
  }

  it("listByClinic 按 clinicId 过滤（隔离他诊所数据）", async () => {
    const a = await makeClinicUser("ref-a@example.com");
    const b = await makeClinicUser("ref-b@example.com");
    const u = await makeUser("ref-u@example.com");
    await seed(a.clinicId, u.id);
    await seed(b.clinicId, u.id);
    const res = await listByClinic(a.clinicId, { page: 1, pageSize: 20 });
    expect(res.total).toBe(1);
    expect(res.items[0].clinicId).toBe(a.clinicId);
  });

  it("update 置 status 与 commissionAmount", async () => {
    const a = await makeClinicUser("ref-u@example.com");
    const u = await makeUser("ref-up@example.com");
    const ref = await seed(a.clinicId, u.id);
    const updated = await update(ref.id, {
      status: "accepted",
      commissionAmount: 50,
    });
    expect(updated.status).toBe("accepted");
    expect(updated.commissionAmount?.toString()).toBe("50");
    expect(await findById(ref.id)).not.toBeNull();
  });
});
