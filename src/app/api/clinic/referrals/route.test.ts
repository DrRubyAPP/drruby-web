import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

describe("clinic referrals (list)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("列表可见本诊所转介，且 status 筛选生效", async () => {
    const me = await makeClinicUser("ref-rt@example.com");
    const other = await makeClinicUser("ref-rt2@example.com");
    const u = await makeUser("ref-rt-u@example.com");
    asClinic(me.userId, me.clinicId);
    await prisma.referral.create({
      data: { clinicId: me.clinicId, fromUserId: u.id, status: "pending" },
    });
    await prisma.referral.create({
      data: { clinicId: me.clinicId, fromUserId: u.id, status: "accepted" },
    });
    await prisma.referral.create({
      data: { clinicId: other.clinicId, fromUserId: u.id, status: "pending" },
    });

    const { GET } = await import("./route");
    const all = await GET(bareRequest("GET"));
    expect((await all.json()).total).toBe(2);

    const pending = await GET(new Request("http://test/api?status=pending"));
    expect((await pending.json()).total).toBe(1);
  });

  it("无创建端点（route 未导出 POST）", async () => {
    const me = await makeClinicUser("ref-post@example.com");
    asClinic(me.userId, me.clinicId);
    const mod = await import("./route");
    // 列表路由未导出 POST，调用时应为 undefined
    expect((mod as Record<string, unknown>).POST).toBeUndefined();
  });
});
