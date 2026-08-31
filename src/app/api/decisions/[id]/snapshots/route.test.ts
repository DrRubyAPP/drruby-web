import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asAnonymous,
  asUser,
  bareRequest,
  disconnectDb,
  jsonRequest,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("GET /api/decisions/[id]/snapshots", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("401 anonymous", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("snap-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(401);
  });

  it("404 cross-user", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("snap-owner@example.com");
    const intruder = await makeUser("snap-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(404);
  });

  it("200 返回 current=null + history=[] 当无 Snapshot（R1 首次打开）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("snap-empty@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.current).toBeNull();
    expect(body.history).toEqual([]);
  });

  it("200 返回 current + history（按 createdAt DESC）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const snapshotRepo = await import(
      "@/lib/db/repositories/decisionSnapshot.repo"
    );
    const owner = await makeUser("snap-list@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    // 建两个 Snapshot：a 先（成为历史），b 后（成为 current）
    const a = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: { yourself: "v1", others: "", science: "", combined: "v1" },
      provenance: "template",
      changeTrigger: "new_record",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, a.id);
    await new Promise((r) => setTimeout(r, 10));
    const b = await snapshotRepo.create(decision.id, {
      yourselfContextRef: null,
      sources: null,
      citations: null,
      synthesis: { yourself: "v2", others: "", science: "", combined: "v2" },
      provenance: "template",
      changeTrigger: "health_context_update",
    });
    await decisionRepo.bindCurrentSnapshot(decision.id, b.id);

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.current.id).toBe(b.id);
    expect(body.current.changeTrigger).toBe("health_context_update");
    expect(body.history).toHaveLength(1);
    expect(body.history[0].id).toBe(a.id);
  });
});
