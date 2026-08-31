import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
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

describe("GET /api/decisions/[id]/ai-state", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("401 anonymous", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("ai-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(401);
  });

  it("404 cross-user", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("ai-owner@example.com");
    const intruder = await makeUser("ai-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(404);
  });

  it("空 Decision（无 healthContext + 无 Records + topicSlug=null）→ Yourself INSUFFICIENT, Others/Science INSUFFICIENT", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("ai-empty@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" }); // 无 topicSlug

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.yourself).toBe("INSUFFICIENT_INFORMATION");
    expect(body.others).toBe("INSUFFICIENT_INFORMATION");
    expect(body.science).toBe("INSUFFICIENT_INFORMATION");
  });

  it("topicSlug 命中语料但无 currentSnapshot → Yourself LOADING, Others/Science READY", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("ai-loading@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "hot flashes" },
      status: "unconfirmed",
    });

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    // 有 healthContext + topicSlug 但无 currentSnapshot → LOADING
    expect(body.yourself).toBe("LOADING");
    expect(body.others).toBe("READY");
    expect(body.science).toBe("READY");
  });

  it("pendingRegenAt 非空 → STALE_UPDATE_AVAILABLE + pendingUntil", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("ai-stale@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    await decisionRepo.touchPendingRegen(decision.id);

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.yourself).toBe("STALE_UPDATE_AVAILABLE");
    expect(body.others).toBe("STALE_UPDATE_AVAILABLE");
    expect(body.science).toBe("STALE_UPDATE_AVAILABLE");
    expect(body.pendingUntil).not.toBeNull();
  });

  it("有 currentSnapshot + 无 pending → Yourself READY, Others/Science READY（topicSlug 命中）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("ai-ready@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });
    const s = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: {
        yourself: "ready",
        others: "",
        science: "",
        combined: "ready",
      },
      provenance: "initial",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, s.id);

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.yourself).toBe("READY");
    expect(body.others).toBe("READY");
    expect(body.science).toBe("READY");
    expect(body.pendingUntil).toBeNull();
  });

  it("B6：provenance=template+llm_trigger_degraded → 状态 READY（不伪装 Failed）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("ai-degraded@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "Try HRT?",
      topicSlug: "hrt",
    });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });
    // LLM 失败降级的 Snapshot（R6 透明化：状态不伪装 Failed）
    const s = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: {
        yourself: "degraded fallback",
        others: "",
        science: "",
        combined: "degraded fallback",
      },
      provenance: "template+llm_trigger_degraded",
      changeTrigger: "new_record",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, s.id);

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    // B6: 降级产出仍标 READY，不伪装 Failed
    expect(body.yourself).toBe("READY");
    expect(body.others).toBe("READY");
    expect(body.science).toBe("READY");
    expect(body.pendingUntil).toBeNull();
  });

  it("B2 静态语料：Yourself READY (有 snapshot) + Others/Science INSUFFICIENT (topicSlug=null)", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("ai-mixed@example.com");
    // topicSlug=null → Others/Science INSUFFICIENT；但有 currentSnapshot → Yourself READY
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });
    const s = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: { yourself: "ok", others: "", science: "", combined: "ok" },
      provenance: "initial",
      changeTrigger: "initial",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, s.id);

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Yourself 有内容（snapshot）→ READY
    expect(body.yourself).toBe("READY");
    // Others/Science topicSlug 未命中语料 → INSUFFICIENT（§25 三视角分别判）
    expect(body.others).toBe("INSUFFICIENT_INFORMATION");
    expect(body.science).toBe("INSUFFICIENT_INFORMATION");
  });
});
