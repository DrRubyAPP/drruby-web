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

describe("POST /api/decisions/[id]/entries（append-only）", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("越权向他人决策追加 → 404", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const owner = await makeUser("entry-owner@example.com");
    const intruder = await makeUser("entry-intruder@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "sleep-quality",
    });

    asUser(intruder.id);
    const res = await POST(
      jsonRequest({ text: "sneaky" }),
      params(decision.id),
    );
    expect(res.status).toBe(404);
  });

  it("append 两条后按时间正序返回，且无覆盖路径", async () => {
    const { POST } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const entryRepo = await import("@/lib/db/repositories/decisionEntry.repo");
    const owner = await makeUser("entry-append@example.com");
    const decision = await decisionRepo.create(owner.id, {
      question: "q",
      goal: "sleep-quality",
    });

    asUser(owner.id);
    const first = await POST(
      jsonRequest({ text: "first", occurredAt: "2026-01-01T00:00:00.000Z" }),
      params(decision.id),
    );
    expect(first.status).toBe(201);
    const second = await POST(
      jsonRequest({ text: "second", occurredAt: "2026-02-01T00:00:00.000Z" }),
      params(decision.id),
    );
    expect(second.status).toBe(201);

    const entries = await entryRepo.listByDecision(decision.id);
    expect(entries.map((e) => e.text)).toEqual(["first", "second"]);
    // append-only 契约：repo 仅暴露 append / listByDecision，无 update/delete
    expect(entryRepo).not.toHaveProperty("update");
    expect(entryRepo).not.toHaveProperty("remove");
  });
});
