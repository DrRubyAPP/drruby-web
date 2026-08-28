import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  asUser,
  disconnectDb,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

describe("GET /api/me/export", () => {
  beforeEach(resetDb);
  afterEach(disconnectDb);

  it("聚合含各域数据，且仅导出本人数据", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const entryRepo = await import("@/lib/db/repositories/decisionEntry.repo");
    const timelineRepo = await import(
      "@/lib/db/repositories/timelineEvent.repo"
    );
    const healthRepo = await import("@/lib/db/repositories/healthRecord.repo");

    const me = await makeUser("export-me@example.com");
    const other = await makeUser("export-other@example.com");

    const myDecision = await decisionRepo.create(me.id, {
      question: "mine",
      goal: "firmness",
    });
    await entryRepo.append({
      decisionId: myDecision.id,
      userId: me.id,
      text: "note",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await timelineRepo.create(me.id, {
      kind: "note",
      title: "my event",
      occurredAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    await healthRepo.create(me.id, {
      kind: "lab",
      title: "my lab",
      ocrStatus: "manual",
      recordedAt: new Date("2026-01-03T00:00:00.000Z"),
    });
    // 他人数据不应出现在我的导出中
    await decisionRepo.create(other.id, {
      question: "theirs",
      goal: "firmness",
    });

    asUser(me.id);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.account.email).toBe("export-me@example.com");
    expect(data.decisions).toHaveLength(1);
    expect(data.decisions[0].question).toBe("mine");
    expect(data.decisions[0].entries).toHaveLength(1);
    expect(data.timeline).toHaveLength(1);
    expect(data.healthRecords).toHaveLength(1);
    // 各域字段均存在（快照结构）
    for (const key of [
      "signals",
      "consent",
      "contributions",
      "studies",
      "experiments",
      "hormone",
      "insights",
    ]) {
      expect(Array.isArray(data[key])).toBe(true);
    }
  });
});
