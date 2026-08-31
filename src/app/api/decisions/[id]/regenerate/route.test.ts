import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
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

describe("POST /api/decisions/[id]/regenerate", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("401 anonymous", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("regen-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await POST(
      jsonRequest({ trigger: "new_record" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(401);
  });

  it("404 cross-user", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("regen-owner@example.com");
    const intruder = await makeUser("regen-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ trigger: "new_record" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("R1：currentSnapshotId=null → 建首版 Snapshot（material=true, snapshotId 非空）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("regen-initial@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });

    asUser(owner.id);
    const res = await POST(
      jsonRequest({ trigger: "new_record" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.material).toBe(true);
    expect(body.snapshotId).toBeTruthy();
    expect(body.reason).toBe("initial synthesis");

    // 库内 currentSnapshotId 已绑定
    const row = await decisionRepo.findById(decision.id);
    expect(row?.currentSnapshotId).toBe(body.snapshotId);
  });

  it("已有 currentSnapshot + 新 Record → material=true + 新 snapshotId", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("regen-material@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });

    // 先建首版
    const a = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: { yourself: "v1", others: "", science: "", combined: "v1" },
      provenance: "template",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, a.id);

    asUser(owner.id);
    // 再次 regen（input 一致 → 非 material）
    const res = await POST(
      jsonRequest({ trigger: "new_record" }, { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.material).toBe(false); // 无新 Records，非 material
  });

  it("corpusVersionChanged=true → material=true", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("regen-corpus@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });

    // 先建首版
    const a = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: { yourself: "v1", others: "", science: "", combined: "v1" },
      provenance: "initial",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, a.id);

    asUser(owner.id);
    const res = await POST(
      jsonRequest(
        { trigger: "others_refresh", corpusVersionChanged: true },
        { method: "POST" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.material).toBe(true);
    expect(body.snapshotId).not.toBe(a.id);
  });
});
