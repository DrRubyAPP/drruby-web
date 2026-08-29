import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decisionEntryRepo } from "@/lib/db";
import { prisma } from "@/lib/db/prisma";
import { create as createDecision } from "./decision.repo";
import {
  append,
  findLastArchivedEntry,
  listByDecision,
} from "./decisionEntry.repo";
import { resetDatabase } from "./test-helpers";
import { create as createUser } from "./userAccount.repo";

async function seed(): Promise<{ userId: string; decisionId: string }> {
  const u = await createUser({
    email: "decision-entry-test@example.com",
    authProvider: "email",
    role: "user",
  });
  const d = await createDecision(u.id, {
    question: "Try filler?",
    goal: "even-tone",
  });
  return { userId: u.id, decisionId: d.id };
}

describe("decisionEntry.repo", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("append-only：两次 append 得两行，内容不被覆盖", async () => {
    const { userId, decisionId } = await seed();
    await append({
      decisionId,
      userId,
      text: "Initial thought",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-01T00:00:00Z"),
    });
    await append({
      decisionId,
      userId,
      text: "Changed my mind",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date("2026-06-08T00:00:00Z"),
    });
    const rows = await listByDecision(decisionId);
    expect(rows).toHaveLength(2);
    expect(rows[0].text).toBe("Initial thought"); // 正序，原始记录保留
    expect(rows[1].text).toBe("Changed my mind");
  });

  it("拒绝非法 lifecycleSnapshot", async () => {
    const { userId, decisionId } = await seed();
    await expect(
      append({
        decisionId,
        userId,
        text: "x",
        // @ts-expect-error 测试无效值
        lifecycleSnapshot: "archived",
        occurredAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});

describe("task-41 entry kind/synthesis", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  it("append with kind + synthesis 持久化两字段", async () => {
    const u = await createUser({
      email: "entry-kind@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    const entry = await append({
      decisionId: d.id,
      userId: u.id,
      text: "Archived: decided_to_do_it",
      lifecycleSnapshot: "CLOSED",
      occurredAt: new Date(),
      kind: "archived_outcome",
      synthesis: {
        outcome: "decided_to_do_it",
        nextStep: null,
        brief: { yourHistory: [] },
      },
    });
    expect(entry.kind).toBe("archived_outcome");
    expect(entry.synthesis).toMatchObject({ outcome: "decided_to_do_it" });

    // 从 DB 读回验证持久化（非内存假象）
    const rows = await listByDecision(d.id);
    const persisted = rows.find((r) => r.id === entry.id);
    expect(persisted?.kind).toBe("archived_outcome");
    expect(persisted?.synthesis).toMatchObject({ outcome: "decided_to_do_it" });
  });

  it("findLastArchivedEntry 返回最近一条 archived_outcome（按 occurredAt desc）", async () => {
    const u = await createUser({
      email: "entry-last@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    const t1 = new Date("2026-06-01T00:00:00Z");
    const t2 = new Date("2026-06-10T00:00:00Z");
    const t3 = new Date("2026-06-20T00:00:00Z");
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "first archive",
      lifecycleSnapshot: "CLOSED",
      occurredAt: t1,
      kind: "archived_outcome",
      synthesis: { outcome: "decided_not_to" },
    });
    // 中间插一条 observation（不应被 findLastArchivedEntry 选中）
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "an observation",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: t2,
      kind: "observation",
    });
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "second archive",
      lifecycleSnapshot: "CLOSED",
      occurredAt: t3,
      kind: "archived_outcome",
      synthesis: { outcome: "decided_to_do_it" },
    });

    const last = await findLastArchivedEntry(d.id);
    expect(last).not.toBeNull();
    expect(last?.occurredAt).toEqual(t3);
    expect(last?.synthesis).toMatchObject({ outcome: "decided_to_do_it" });
  });

  it("findLastArchivedEntry 无 archived entry 时返回 null", async () => {
    const u = await createUser({
      email: "entry-none@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    await append({
      decisionId: d.id,
      userId: u.id,
      text: "just an observation",
      lifecycleSnapshot: "ACTIVE",
      occurredAt: new Date(),
    });
    const last = await findLastArchivedEntry(d.id);
    expect(last).toBeNull();
  });

  it("append 拒绝非法 kind", async () => {
    const u = await createUser({
      email: "entry-bad-kind@example.com",
      authProvider: "email",
      role: "user",
    });
    const d = await createDecision(u.id, { question: "q" });
    await expect(
      append({
        decisionId: d.id,
        userId: u.id,
        text: "x",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: new Date(),
        // @ts-expect-error 测试无效值
        kind: "bogus_kind",
      }),
    ).rejects.toThrow();
  });

  it("append-only 契约保持：未导出 update/remove", () => {
    const repo = decisionEntryRepo as unknown as Record<string, unknown>;
    expect(repo.update).toBeUndefined();
    expect(repo.remove).toBeUndefined();
  });
});
