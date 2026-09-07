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

  it("软删 Decision 进 deletedDecisions 分区（D-10），entries 保留；timeline 含其关联事件（P-2）", async () => {
    const { GET } = await import("./route");
    const decisionRepo = await import("@/lib/db/repositories/decision.repo");
    const entryRepo = await import("@/lib/db/repositories/decisionEntry.repo");
    const timelineRepo = await import(
      "@/lib/db/repositories/timelineEvent.repo"
    );

    const me = await makeUser("export-del@example.com");
    const active = await decisionRepo.create(me.id, {
      question: "active one",
      goal: "firmness",
    });
    const deleted = await decisionRepo.create(me.id, {
      question: "deleted one",
      goal: "firmness",
    });
    // 软删前先建 observation entry（D-10：软删行 entries 仍导出）
    await entryRepo.append({
      decisionId: deleted.id,
      userId: me.id,
      text: "observation before delete",
      lifecycleSnapshot: "OBSERVING",
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    // 软删 Decision 的关联 timeline 事件（P-2：视图已滤、导出仍在）
    await timelineRepo.create(me.id, {
      kind: "note",
      title: "event linked to deleted",
      decisionId: deleted.id,
      occurredAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    await timelineRepo.create(me.id, {
      kind: "note",
      title: "event linked to active",
      decisionId: active.id,
      occurredAt: new Date("2026-01-03T00:00:00.000Z"),
    });

    await decisionRepo.softDelete(deleted.id);

    asUser(me.id);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    // 活跃分区只含活跃行
    expect(data.decisions).toHaveLength(1);
    expect(data.decisions[0].question).toBe("active one");

    // deletedDecisions 分区只含软删行，带 deletedAt 时间戳与 entries
    expect(data.deletedDecisions).toHaveLength(1);
    expect(data.deletedDecisions[0].question).toBe("deleted one");
    expect(data.deletedDecisions[0].deletedAt).not.toBe(null);
    expect(data.deletedDecisions[0].entries).toHaveLength(1);
    expect(data.deletedDecisions[0].entries[0].text).toBe(
      "observation before delete",
    );

    // timeline 导出完整版：软删 Decision 关联事件保留
    const titles: string[] = data.timeline.map(
      (e: { title: string }) => e.title,
    );
    expect(titles).toContain("event linked to deleted");
    expect(titles).toContain("event linked to active");
  });
});
