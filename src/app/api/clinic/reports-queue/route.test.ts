import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asClinic,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeClinicUser,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/clinic", async () =>
  (await import("@/lib/test/route-helpers")).clinicSessionMock(),
);

describe("clinic reports-queue (list + create draft)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("创建 AI 草稿后列表可见，默认 ai_drafted", async () => {
    const me = await makeClinicUser("rq@example.com");
    const patient = await makeUser("rq-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const { POST } = await import("./route");
    const created = await POST(
      jsonRequest(
        {
          patientUserId: patient.id,
          draftContent: { summary: "AI 草稿", findings: [] },
        },
        { method: "POST" },
      ),
    );
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.status).toBe("ai_drafted");

    const { GET } = await import("./route");
    const list = await GET(bareRequest("GET"));
    const listBody = await list.json();
    expect(listBody.total).toBe(1);
    expect(listBody.items[0].patientUserId).toBe(patient.id);
  });

  it("status 筛选生效", async () => {
    const me = await makeClinicUser("rq2@example.com");
    const patient = await makeUser("rq2-patient@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/clinicReport.repo");
    const rpt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "d" },
    });
    await repo.update(rpt.id, { status: "in_review", reviewerUserId: me.userId });

    const { GET } = await import("./route");
    const inReview = await GET(new Request("http://test/api?status=in_review"));
    expect((await inReview.json()).total).toBe(1);
    const drafts = await GET(new Request("http://test/api?status=ai_drafted"));
    expect((await drafts.json()).total).toBe(0);
  });
});
