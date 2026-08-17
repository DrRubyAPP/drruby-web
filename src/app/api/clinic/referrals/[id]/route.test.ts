import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
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

describe("clinic referrals (detail + update state machine)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  async function seed(clinicId: string, fromUserId: string, status = "pending") {
    return prisma.referral.create({
      data: { clinicId, fromUserId, status, requestedService: "botox" },
    });
  }

  it("详情可见且 commissionAmount 投影为字符串", async () => {
    const me = await makeClinicUser("ref-det@example.com");
    const u = await makeUser("ref-det-u@example.com");
    asClinic(me.userId, me.clinicId);
    const ref = await seed(me.clinicId, u.id);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(ref.id));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe(ref.id);
  });

  it("改他人诊所转介 → 404", async () => {
    const a = await makeClinicUser("ref-a@example.com");
    const b = await makeClinicUser("ref-b@example.com");
    const u = await makeUser("ref-ab-u@example.com");
    const ref = await seed(a.clinicId, u.id);
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(ref.id));
    expect(res.status).toBe(404);
  });

  it("pending → accepted（带 commissionAmount）", async () => {
    const me = await makeClinicUser("ref-ac@example.com");
    const u = await makeUser("ref-ac-u@example.com");
    asClinic(me.userId, me.clinicId);
    const ref = await seed(me.clinicId, u.id);
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest(
        { status: "accepted", commissionAmount: 120 },
        { method: "PATCH" },
      ),
      params(ref.id),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("accepted");
    expect(body.commissionAmount).toBe("120");
  });

  it("非法跃迁 accepted → pending → 422", async () => {
    const me = await makeClinicUser("ref-422@example.com");
    const u = await makeUser("ref-422-u@example.com");
    asClinic(me.userId, me.clinicId);
    const ref = await seed(me.clinicId, u.id, "accepted");
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ status: "pending" }, { method: "PATCH" }),
      params(ref.id),
    );
    expect(res.status).toBe(422);
  });
});
