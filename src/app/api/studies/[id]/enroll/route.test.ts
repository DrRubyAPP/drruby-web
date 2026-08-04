import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/studies/[id]/enroll", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未给 consent（consentGiven!=true）→ 400", async () => {
    const { POST } = await import("./route");
    const studyRepo = await import("@/lib/db/repositories/researchStudy.repo");
    const user = await makeUser("enroll-noconsent@example.com");
    const study = await studyRepo.create({
      name: "S",
      recruitmentStatus: "recruiting",
    });

    asUser(user.id);
    const res = await POST(
      jsonRequest({ consentGiven: false }),
      params(study.id),
    );
    expect(res.status).toBe(400);
  });

  it("研究不存在 → 404", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("enroll-404@example.com");
    asUser(user.id);
    const res = await POST(jsonRequest({ consentGiven: true }), params("nope"));
    expect(res.status).toBe(404);
  });

  it("enroll 后 GET /api/studies 状态变 enrolled；重复 enroll 幂等", async () => {
    const { POST } = await import("./route");
    const { GET } = await import("../../route");
    const studyRepo = await import("@/lib/db/repositories/researchStudy.repo");
    const enrollRepo = await import(
      "@/lib/db/repositories/studyEnrollment.repo"
    );
    const user = await makeUser("enroll-ok@example.com");
    const study = await studyRepo.create({
      name: "Sleep & Skin",
      recruitmentStatus: "recruiting",
    });
    asUser(user.id);

    // 入组前：招募中 → invited / 未同意
    const before = await (await GET()).json();
    expect(before.find((s: { id: string }) => s.id === study.id)).toMatchObject(
      { status: "invited", consentGiven: false },
    );

    const res = await POST(
      jsonRequest({ consentGiven: true, arm: "device" }),
      params(study.id),
    );
    expect(res.status).toBe(201);

    const after = await (await GET()).json();
    expect(after.find((s: { id: string }) => s.id === study.id)).toMatchObject({
      status: "enrolled",
      arm: "device",
      consentGiven: true,
    });

    // 重复入组幂等：(studyId,userId) 唯一，仍为单条
    const again = await POST(
      jsonRequest({ consentGiven: true, arm: "device" }),
      params(study.id),
    );
    expect(again.status).toBe(201);
    const rows = await enrollRepo.listByUser(user.id);
    expect(rows.filter((e) => e.studyId === study.id)).toHaveLength(1);
  });
});
