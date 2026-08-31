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

describe("/api/decisions/[id]/health-context", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("GET 401 anonymous", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-anon@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asAnonymous();
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(401);
  });

  it("GET 404 cross-user", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-owner@example.com");
    const intruder = await makeUser("hc-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });

    asUser(intruder.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(404);
  });

  it("GET 200 返回预填（healthContext + status + confirmedAt=null 初始）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-get@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    // 预填 healthContext
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "hot flashes" },
      status: "unconfirmed",
    });

    asUser(owner.id);
    const res = await GET(bareRequest("GET"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.healthContext).toMatchObject({ symptoms: "hot flashes" });
    expect(body.status).toBe("unconfirmed");
    expect(body.healthContextConfirmedAt).toBeNull();
  });

  it("PUT 写 healthContext + 刷 lastUserActivityAt", async () => {
    const { PUT } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-put@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    const before = await decisionRepo.findById(decision.id);

    asUser(owner.id);
    const res = await PUT(
      jsonRequest(
        { healthContext: { symptoms: "fatigue" }, status: "unconfirmed" },
        { method: "PUT" },
      ),
      params(decision.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.healthContext).toMatchObject({ symptoms: "fatigue" });
    expect(body.status).toBe("unconfirmed");

    const after = await decisionRepo.findById(decision.id);
    expect(after!.lastUserActivityAt.getTime()).toBeGreaterThanOrEqual(
      before!.lastUserActivityAt.getTime(),
    );
  });

  it("POST confirm 刷 confirmedAt（§20）", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-confirm@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });

    asUser(owner.id);
    const res = await POST(bareRequest("POST"), params(decision.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("confirmed");
    expect(body.healthContextConfirmedAt).not.toBeNull();
  });

  it("§20 永不自动从 unconfirmed 转 confirmed（GET 不刷 confirmedAt）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("hc-noauto@example.com");
    const decision = await decisionRepo.create(owner.id, { question: "q" });
    await decisionRepo.updateHealthContext(decision.id, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });

    asUser(owner.id);
    // 多次 GET
    await GET(bareRequest("GET"), params(decision.id));
    await GET(bareRequest("GET"), params(decision.id));
    const res = await GET(bareRequest("GET"), params(decision.id));
    const body = await res.json();
    expect(body.status).toBe("unconfirmed");
    expect(body.healthContextConfirmedAt).toBeNull(); // 永不自动转
  });
});
