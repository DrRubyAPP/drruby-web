import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("POST /api/decisions/[id]/check-freshness", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("401 anonymous", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(401);

    // 库内未写 freshnessCheckedAt
    const row = await decisionRepo.findById(decision.id);
    expect(row?.freshnessCheckedAt).toBe(null);
  });

  it("404 cross-user（不泄露存在性）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-real@example.com");
    const intruder = await makeUser("fresh-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("200 写 freshnessCheckedAt=now + 无 material 变化返回 false", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("fresh-ok@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(owner.id);
    const before = Date.now();
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.materialChange).toBe(false);
    expect(body.freshnessCheckedAt).not.toBe(null);
    expect(new Date(body.freshnessCheckedAt).getTime()).toBeGreaterThanOrEqual(
      before,
    );

    // 库内已写入
    const row = await decisionRepo.findById(decision.id);
    expect(row?.freshnessCheckedAt).not.toBe(null);
    expect(row?.freshnessCheckedAt?.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("healthContext 相对 current snapshot 变化 → materialChange=true", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("fresh-health-context@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "old" },
      status: "unconfirmed",
    });
    const snapshot = await snapshotRepo.create(decision.id, {
      yourselfContextRef: {
        healthContextSnapshot: { symptoms: "old" },
        connectedRecordRefs: [],
      },
      sources: null,
      citations: null,
      synthesis: { yourself: "old", others: "", science: "", combined: "old" },
      provenance: "initial",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, snapshot.id);
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "new" },
      status: "unconfirmed",
    });

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.materialChange).toBe(true);
  });

  it("新增 record 类别相对 current snapshot 变化 → materialChange=true", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const recordRepo = await import("@/lib/db/repositories/healthRecord.repo");
    const linkRepo = await import(
      "@/lib/db/repositories/decisionHealthRecord.repo"
    );
    const owner = await makeUser("fresh-record-category@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    const snapshot = await snapshotRepo.create(decision.id, {
      yourselfContextRef: {
        healthContextSnapshot: null,
        connectedRecordRefs: [],
      },
      sources: null,
      citations: null,
      synthesis: { yourself: "old", others: "", science: "", combined: "old" },
      provenance: "initial",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, snapshot.id);
    const record = await recordRepo.create(owner.id, {
      kind: "lab",
      title: "Estradiol panel",
      documentClass: "Lab",
      status: "CONFIRMED",
      recordedAt: new Date(),
    });
    await linkRepo.connect(decision.id, record.id, owner.id);

    asUser(owner.id);
    const res = await POST(
      new Request("http://test", { method: "POST" }),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.materialChange).toBe(true);
  });
});
