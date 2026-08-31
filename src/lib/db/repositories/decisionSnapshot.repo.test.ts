import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  bindCurrentSnapshot,
  clearPendingRegen,
  create as createDecision,
  getPendingRegen,
  REGEN_DEBOUNCE_MINUTES,
  touchPendingRegen,
  updateHealthContext,
} from "./decision.repo";
import {
  create,
  findCurrent,
  listHistoryByDecision,
  type SnapshotCreateInput,
} from "./decisionSnapshot.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "snapshot-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

async function seedDecision(userId: string): Promise<string> {
  const d = await createDecision(userId, { question: "Try Thermage?" });
  return d.id;
}

const SNAPSHOT_A: SnapshotCreateInput = {
  yourselfContextRef: {
    healthContextSnapshot: { symptoms: "hot flashes" },
    connectedRecordRefs: [{ id: "rec1", kind: "lab", summary: "E2 50" }],
  },
  sources: [{ type: "record", ref: "rec1", summary: "E2 50" }],
  citations: [{ label: "[1]", ref: "rec1" }],
  synthesis: { yourself: "Yourself A", others: "", science: "", combined: "A" },
  provenance: "template",
  changeTrigger: "new_record",
};

const SNAPSHOT_B: SnapshotCreateInput = {
  yourselfContextRef: {
    healthContextSnapshot: { symptoms: "hot flashes + sleep" },
    connectedRecordRefs: [{ id: "rec2", kind: "lab", summary: "E2 80" }],
  },
  sources: [{ type: "record", ref: "rec2", summary: "E2 80" }],
  citations: [{ label: "[2]", ref: "rec2" }],
  synthesis: { yourself: "Yourself B", others: "", science: "", combined: "B" },
  provenance: "template+llm_trigger",
  changeTrigger: "health_context_update",
};

describe("decisionSnapshot.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("create + findCurrent（currentSnapshotId 指针）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    const s = await create(decisionId, SNAPSHOT_A);
    await bindCurrentSnapshot(decisionId, s.id);

    const current = await findCurrent(decisionId);
    expect(current?.id).toBe(s.id);
    expect(current?.provenance).toBe("template");
    expect(current?.changeTrigger).toBe("new_record");
    expect(current?.synthesis).toMatchObject({ yourself: "Yourself A" });
  });

  it("listHistoryByDecision：不含 current，按 createdAt DESC", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    const a = await create(decisionId, SNAPSHOT_A);
    await bindCurrentSnapshot(decisionId, a.id);
    // 等 10ms 让 createdAt 严格递增
    await new Promise((r) => setTimeout(r, 10));
    const b = await create(decisionId, SNAPSHOT_B);
    await bindCurrentSnapshot(decisionId, b.id);

    const history = await listHistoryByDecision(decisionId);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(a.id); // 旧 Snapshot 在前（DESC by createdAt）

    const current = await findCurrent(decisionId);
    expect(current?.id).toBe(b.id);
  });

  it("listHistoryByDecision limit 截断", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    const a = await create(decisionId, SNAPSHOT_A);
    await bindCurrentSnapshot(decisionId, a.id);
    await new Promise((r) => setTimeout(r, 10));
    const b = await create(decisionId, SNAPSHOT_B);
    await bindCurrentSnapshot(decisionId, b.id);

    const history = await listHistoryByDecision(decisionId, { limit: 1 });
    expect(history).toHaveLength(1);
  });

  it("findCurrent：currentSnapshotId=null 返回 null（R1 首次打开）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);
    // 不调 bindCurrentSnapshot → currentSnapshotId 仍 null
    const current = await findCurrent(decisionId);
    expect(current).toBeNull();
  });

  it("bindCurrentSnapshot：清空 pendingRegenAt（D6 lazy fire 后原子清理）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    // 先 touch pending
    await touchPendingRegen(decisionId);
    expect((await getPendingRegen(decisionId))?.getTime()).toBeGreaterThan(
      Date.now(),
    );

    // 建 Snapshot + bind → 清 pending
    const s = await create(decisionId, SNAPSHOT_A);
    await bindCurrentSnapshot(decisionId, s.id);
    expect(await getPendingRegen(decisionId)).toBeNull();
  });
});

describe("decision.repo health-context / pending 扩展", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("updateHealthContext：写 healthContext + 刷 lastUserActivityAt", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    const before = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    const updated = await updateHealthContext(decisionId, {
      healthContext: { symptoms: "fatigue", goals_concerns: "energy" },
      status: "unconfirmed",
    });
    expect(updated.healthContext).toMatchObject({
      symptoms: "fatigue",
      goals_concerns: "energy",
    });
    expect(updated.healthContextStatus).toBe("unconfirmed");
    // 未转 confirmed → 不刷 confirmedAt
    expect(updated.healthContextConfirmedAt).toBeNull();
    // meaningful activity 抬升
    expect(updated.lastUserActivityAt.getTime()).toBeGreaterThanOrEqual(
      before.lastUserActivityAt.getTime(),
    );
  });

  it("updateHealthContext：status 转 confirmed 刷 confirmedAt（§20）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    // 先 unconfirmed
    await updateHealthContext(decisionId, {
      healthContext: { symptoms: "x" },
      status: "unconfirmed",
    });
    const before = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });
    expect(before.healthContextConfirmedAt).toBeNull();

    // 转 confirmed
    const updated = await updateHealthContext(decisionId, {
      healthContext: { symptoms: "x" },
      status: "confirmed",
    });
    expect(updated.healthContextStatus).toBe("confirmed");
    expect(updated.healthContextConfirmedAt).not.toBeNull();
  });

  it("touchPendingRegen：续期到 now + REGEN_DEBOUNCE_MINUTES（D6）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    const before = Date.now();
    await touchPendingRegen(decisionId);
    const pending = await getPendingRegen(decisionId);
    expect(pending).not.toBeNull();
    const minExpected = before + (REGEN_DEBOUNCE_MINUTES - 1) * 60_000;
    expect(pending!.getTime()).toBeGreaterThan(minExpected);
  });

  it("touchPendingRegen：已有 pending 续期（不重置为新窗口，D6 续期）", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    await touchPendingRegen(decisionId);
    const first = await getPendingRegen(decisionId);
    expect(first).not.toBeNull();

    // 立即再 touch → 续期到 now + window（应 ≥ first）
    await touchPendingRegen(decisionId);
    const second = await getPendingRegen(decisionId);
    expect(second!.getTime()).toBeGreaterThanOrEqual(first!.getTime());
  });

  it("clearPendingRegen：置 null", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);

    await touchPendingRegen(decisionId);
    expect(await getPendingRegen(decisionId)).not.toBeNull();

    await clearPendingRegen(decisionId);
    expect(await getPendingRegen(decisionId)).toBeNull();
  });

  it("getPendingRegen：无 pending 返回 null", async () => {
    const userId = await seedUser();
    const decisionId = await seedDecision(userId);
    expect(await getPendingRegen(decisionId)).toBeNull();
  });
});
