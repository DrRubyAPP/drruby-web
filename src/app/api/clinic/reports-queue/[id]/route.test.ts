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

describe("clinic reports-queue (detail + advance state machine)", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("详情可见且 draftContent 透传", async () => {
    const me = await makeClinicUser("rq-det@example.com");
    const patient = await makeUser("rq-det-p@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/clinicReport.repo");
    const rpt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "draft" },
    });
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(rpt.id));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.draftContent.summary).toBe("draft");
  });

  it("改他人诊所报告 → 404", async () => {
    const a = await makeClinicUser("rq-a@example.com");
    const b = await makeClinicUser("rq-b@example.com");
    const patient = await makeUser("rq-ab-p@example.com");
    const repo = await import("@/lib/db/repositories/clinic/clinicReport.repo");
    const rpt = await repo.create(a.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "d" },
    });
    asClinic(b.userId, b.clinicId);
    const { GET } = await import("./route");
    const res = await GET(bareRequest("GET"), params(rpt.id));
    expect(res.status).toBe(404);
  });

  it("ai_drafted → in_review → approved → sent 完整推进", async () => {
    const me = await makeClinicUser("rq-sm@example.com");
    const patient = await makeUser("rq-sm-p@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/clinicReport.repo");
    const rpt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "d" },
    });
    const { PATCH } = await import("./route");

    const inReview = await PATCH(
      jsonRequest(
        { status: "in_review", reviewerUserId: me.userId },
        { method: "PATCH" },
      ),
      params(rpt.id),
    );
    expect((await inReview.json()).reviewerUserId).toBe(me.userId);

    const approved = await PATCH(
      jsonRequest(
        { status: "approved", finalContent: { summary: "final" } },
        { method: "PATCH" },
      ),
      params(rpt.id),
    );
    expect((await approved.json()).finalContent.summary).toBe("final");

    const sent = await PATCH(
      jsonRequest({ status: "sent" }, { method: "PATCH" }),
      params(rpt.id),
    );
    const sentBody = await sent.json();
    expect(sentBody.status).toBe("sent");
    expect(sentBody.sentAt).not.toBeNull();
  });

  it("跳步 ai_drafted → approved → 422", async () => {
    const me = await makeClinicUser("rq-422@example.com");
    const patient = await makeUser("rq-422-p@example.com");
    asClinic(me.userId, me.clinicId);
    const repo = await import("@/lib/db/repositories/clinic/clinicReport.repo");
    const rpt = await repo.create(me.clinicId, {
      patientUserId: patient.id,
      draftContent: { summary: "d" },
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      jsonRequest({ status: "approved" }, { method: "PATCH" }),
      params(rpt.id),
    );
    expect(res.status).toBe(422);
  });
});
