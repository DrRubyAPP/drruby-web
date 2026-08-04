import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  bareRequest,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/studies/[id]/withdraw", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("未入组 → 404", async () => {
    const { POST } = await import("./route");
    const studyRepo = await import("@/lib/db/repositories/researchStudy.repo");
    const user = await makeUser("withdraw-none@example.com");
    const study = await studyRepo.create({
      name: "S",
      recruitmentStatus: "recruiting",
    });
    asUser(user.id);
    const res = await POST(bareRequest("POST"), params(study.id));
    expect(res.status).toBe(404);
  });

  it("入组后退出 → withdrawnAt 标记 + 收回同意（可退出）", async () => {
    const { POST } = await import("./route");
    const studyRepo = await import("@/lib/db/repositories/researchStudy.repo");
    const enrollRepo = await import(
      "@/lib/db/repositories/studyEnrollment.repo"
    );
    const user = await makeUser("withdraw-ok@example.com");
    const study = await studyRepo.create({
      name: "S",
      recruitmentStatus: "recruiting",
    });
    await enrollRepo.enroll({
      studyId: study.id,
      userId: user.id,
      status: "enrolled",
      consentGiven: true,
    });

    asUser(user.id);
    const res = await POST(bareRequest("POST"), params(study.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ withdrawn: true, consentGiven: false });

    const rows = await enrollRepo.listByUser(user.id);
    const row = rows.find((e) => e.studyId === study.id);
    expect(row?.withdrawnAt).not.toBeNull();
    expect(row?.consentGiven).toBe(false);
  });
});
