import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  bindCurrentSnapshot,
  create as createDecision,
  REGEN_DEBOUNCE_MINUTES,
  touchPendingRegen,
  update as updateDecision,
  updateHealthContext,
} from "@/lib/db/repositories/decision.repo";
import {
  connect,
  listByDecision,
} from "@/lib/db/repositories/decisionHealthRecord.repo";
import {
  create as createSnapshot,
  findCurrent,
} from "@/lib/db/repositories/decisionSnapshot.repo";
import { create as createRecord } from "@/lib/db/repositories/healthRecord.repo";
import { resetDatabase } from "@/lib/db/repositories/test-helpers";
import { create as createUser } from "@/lib/db/repositories/userAccount.repo";
import { RegenerationOrchestrator } from "./orchestrator";
import type { SynthesisInput, SynthesisResult, Synthesizer } from "./types";

async function seedUser(): Promise<string> {
  const u = await createUser({
    email: "orch-test@example.com",
    authProvider: "email",
    role: "user",
  });
  return u.id;
}

async function seedHrtDecision(userId: string): Promise<string> {
  const d = await createDecision(userId, {
    question: "Try HRT?",
    topic: "HRT",
    topicSlug: "hrt",
  });
  // 预填 healthContext（用于 D2 关键词匹配兜底 + Yourself 综合）
  await updateHealthContext(d.id, {
    healthContext: {
      symptoms: "hot flashes",
      medications_treatments: "none",
      related_health_changes: "perimenopause",
      current_health_state: "fatigue",
      goals_concerns: "sleep",
    },
    status: "unconfirmed",
  });
  return d.id;
}

async function seedLabRecord(
  userId: string,
  opts: {
    kind?: string;
    documentClass?: "Lab" | "Imaging" | null;
    title?: string;
  } = {},
): Promise<string> {
  const rec = await createRecord(userId, {
    kind: (opts.kind as "lab" | "imaging") ?? "lab",
    title: opts.title ?? "Estradiol panel",
    documentClass: opts.documentClass ?? "Lab",
    status: "CONFIRMED",
    recordedAt: new Date(),
  });
  return rec.id;
}

/** Mock Synthesizer：返回固定结果，便于断言 orchestrator 行为 */
function makeMockSynthesizer(): Synthesizer & {
  calls: SynthesisInput[];
  setNextResult(r: Partial<SynthesisResult>): void;
} {
  const calls: SynthesisInput[] = [];
  let nextResult: Partial<SynthesisResult> = {};
  const synth: Synthesizer = {
    async synthesize(input: SynthesisInput): Promise<SynthesisResult> {
      calls.push(input);
      return {
        synthesis: {
          yourself: "yourself-mock",
          others: "others-mock",
          science: "science-mock",
          combined: "combined-mock",
          ...(nextResult.synthesis ?? {}),
        },
        sources: nextResult.sources ?? [],
        citations: nextResult.citations ?? [],
        provenance: nextResult.provenance ?? "template",
        triggerHumanLabel: nextResult.triggerHumanLabel ?? "mock label",
      };
    },
  };
  return Object.assign(synth, {
    calls,
    setNextResult(r: Partial<SynthesisResult>) {
      nextResult = r;
    },
  });
}

describe("RegenerationOrchestrator", () => {
  beforeEach(async () => await resetDatabase());
  afterEach(async () => await prisma.$disconnect());

  describe("onRecordConnected (D2 + D6 续期)", () => {
    it("相关 Record → touchPendingRegen（D6 续期到 now+REGEN_DEBOUNCE_MINUTES）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const recordId = await seedLabRecord(userId);
      await connect(decisionId, recordId, userId);

      const links = await listByDecision(decisionId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const result = await orch.onRecordConnected({
        decisionId,
        recordRef: {
          id: links[0].healthRecordId,
          kind: links[0].healthRecord.kind,
          documentClass: links[0].healthRecord.documentClass,
          summary: links[0].healthRecord.title,
        },
      });
      expect(result.touched).toBe(true);

      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decision.pendingRegenAt).not.toBeNull();
      const minExpected = Date.now() + (REGEN_DEBOUNCE_MINUTES - 1) * 60_000;
      expect(decision.pendingRegenAt!.getTime()).toBeGreaterThan(minExpected);
    });

    it("不相关 Record（HRT + 皮肤照片）→ no-op（不 touch pending）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const recordId = await seedLabRecord(userId, {
        kind: "imaging",
        documentClass: "Imaging",
        title: "skin photo",
      });
      await connect(decisionId, recordId, userId);

      const links = await listByDecision(decisionId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const result = await orch.onRecordConnected({
        decisionId,
        recordRef: {
          id: links[0].healthRecordId,
          kind: links[0].healthRecord.kind,
          documentClass: links[0].healthRecord.documentClass,
          summary: links[0].healthRecord.title,
        },
      });
      expect(result.touched).toBe(false);

      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decision.pendingRegenAt).toBeNull();
    });

    it("多条相关 Record 续期同一 pending（D6 合并不开多窗口）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const r1 = await seedLabRecord(userId, { title: "lab A" });
      const r2 = await seedLabRecord(userId, { title: "lab B" });
      await connect(decisionId, r1, userId);
      await connect(decisionId, r2, userId);

      const links = await listByDecision(decisionId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      // 模拟两次 onRecordConnected（实际应在 connect 路径触发）
      for (const link of links) {
        await orch.onRecordConnected({
          decisionId,
          recordRef: {
            id: link.healthRecordId,
            kind: link.healthRecord.kind,
            documentClass: link.healthRecord.documentClass,
            summary: link.healthRecord.title,
          },
        });
      }
      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      // 只有一个 pendingRegenAt（续期，不开新窗口）
      expect(decision.pendingRegenAt).not.toBeNull();
    });
  });

  describe("maybeFirePendingRegen (lazy fire on open)", () => {
    it("无 pending → no-op", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const result = await orch.maybeFirePendingRegen(decisionId);
      expect(result.fired).toBe(false);
    });

    it("pending 未过窗口 → 不 fire，返回 STALE + pendingUntil", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      await touchPendingRegen(decisionId); // 设置未来时间
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const result = await orch.maybeFirePendingRegen(decisionId);
      expect(result.fired).toBe(false);
      expect(result.state).toBe("STALE_UPDATE_AVAILABLE");
      expect(result.pendingUntil).toBeInstanceOf(Date);
    });

    it("pending 已过窗口 → fire regeneration（建 Snapshot + bind + clear pending）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const recordId = await seedLabRecord(userId);
      await connect(decisionId, recordId, userId);

      // 手动把 pendingRegenAt 设到过去（模拟窗口已过）
      await prisma.decision.update({
        where: { id: decisionId },
        data: { pendingRegenAt: new Date(Date.now() - 60_000) },
      });

      const synth = makeMockSynthesizer();
      const orch = new RegenerationOrchestrator({ synthesizer: synth });
      const result = await orch.maybeFirePendingRegen(decisionId);
      expect(result.fired).toBe(true);

      // Snapshot 已建 + currentSnapshotId 指向
      const current = await findCurrent(decisionId);
      expect(current).not.toBeNull();
      expect(current?.provenance).toBe("template");
      expect(current?.changeTrigger).toBe("new_record");

      // pendingRegenAt 已清
      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decision.pendingRegenAt).toBeNull();
      expect(decision.currentSnapshotId).toBe(current?.id);

      // synthesizer 被调用一次
      expect(synth.calls).toHaveLength(1);
    });
  });

  describe("runRegeneration (material 判定)", () => {
    it("material（新 Record 类别）→ 建 Snapshot + bind + clear", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const r1 = await seedLabRecord(userId);
      await connect(decisionId, r1, userId);

      // 先建首版 Snapshot（含 r1，trigger=initial）
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      await orch.runInitialSynthesis(decisionId);
      const initialSnapshot = await findCurrent(decisionId);

      // 新增第二个不同类别的 Record（Imaging，与 Lab 不同桶）→ material
      const r2 = await seedLabRecord(userId, {
        kind: "imaging",
        documentClass: "Imaging",
        title: "imaging A",
      });
      await connect(decisionId, r2, userId);

      const result = await orch.runRegeneration(decisionId, {
        trigger: "new_record",
      });
      expect(result.material).toBe(true);
      expect(result.snapshotId).toBeTruthy();

      // currentSnapshotId 现在指向新 Snapshot（initial 那个变成历史）
      const current = await findCurrent(decisionId);
      expect(current?.id).toBe(result.snapshotId);
      expect(current?.id).not.toBe(initialSnapshot?.id);
      expect(current?.changeTrigger).toBe("new_record");
    });

    it("非 material（同桶新增支持证据）→ 不建 Snapshot + clear pending", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const r1 = await seedLabRecord(userId, { title: "lab A" });
      const r2 = await seedLabRecord(userId, { title: "lab B same bucket" });
      await connect(decisionId, r1, userId);

      // 建首版 Snapshot（含 r1）
      const synth = makeMockSynthesizer();
      const orch = new RegenerationOrchestrator({ synthesizer: synth });
      await orch.runInitialSynthesis(decisionId);
      const initialSnapshot = await findCurrent(decisionId);

      // 新增 r2（同 kind=lab, documentClass=Lab 桶）→ supporting evidence，非 material
      await connect(decisionId, r2, userId);
      // touch pending 模拟 onRecordConnected
      await touchPendingRegen(decisionId);

      const result = await orch.runRegeneration(decisionId, {
        trigger: "new_record",
      });
      expect(result.material).toBe(false);

      // currentSnapshotId 不变
      const after = await findCurrent(decisionId);
      expect(after?.id).toBe(initialSnapshot?.id);

      // pendingRegenAt 已清（虽然非 material，但 pending 已处理）
      const decision = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decision.pendingRegenAt).toBeNull();
    });

    it("corpus 版本变 → material（B2/§22）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      await orch.runInitialSynthesis(decisionId);

      const result = await orch.runRegeneration(decisionId, {
        trigger: "others_refresh",
        corpusVersionChanged: true,
      });
      expect(result.material).toBe(true);
    });
  });

  describe("runInitialSynthesis (R1 首次打开)", () => {
    it("currentSnapshotId=null → 建首版 Snapshot（trigger=initial, provenance=initial）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });

      const result = await orch.runInitialSynthesis(decisionId);
      expect(result.snapshotId).toBeTruthy();
      expect(result.created).toBe(true);

      const current = await findCurrent(decisionId);
      expect(current?.id).toBe(result.snapshotId);
      expect(current?.changeTrigger).toBe("initial");
      expect(current?.provenance).toBe("initial");
    });

    it("已有 currentSnapshotId → 不重建（idempotent）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });

      await orch.runInitialSynthesis(decisionId);
      const result = await orch.runInitialSynthesis(decisionId);
      expect(result.created).toBe(false);
    });
  });

  describe("B5 pending 跨重启（D6 DB 时间戳持久化）", () => {
    it("进程重启模拟：新 orchestrator 实例仍能读 DB pendingRegenAt 并 fire", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      const recordId = await seedLabRecord(userId);
      await connect(decisionId, recordId, userId);

      // 第一阶段：用 orchestrator-A 触发 onRecordConnected（写入 pendingRegenAt）
      const orchA = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const links = await listByDecision(decisionId);
      await orchA.onRecordConnected({
        decisionId,
        recordRef: {
          id: links[0].healthRecordId,
          kind: links[0].healthRecord.kind,
          documentClass: links[0].healthRecord.documentClass,
          summary: links[0].healthRecord.title,
        },
      });

      // 模拟进程重启：丢弃 orchA，新实例 orchB 读同一 DB
      const decisionMid = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decisionMid.pendingRegenAt).not.toBeNull();

      // 手动让 pending 过期（模拟重启期间时间流逝）
      await prisma.decision.update({
        where: { id: decisionId },
        data: { pendingRegenAt: new Date(Date.now() - 60_000) },
      });

      // 第二阶段：orchB（无内存状态）打开 Decision → lazy fire 触发
      const synthB = makeMockSynthesizer();
      const orchB = new RegenerationOrchestrator({ synthesizer: synthB });
      const result = await orchB.maybeFirePendingRegen(decisionId);
      expect(result.fired).toBe(true);

      const current = await findCurrent(decisionId);
      expect(current).not.toBeNull();
      expect(current?.changeTrigger).toBe("new_record");

      const decisionAfter = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decisionAfter.pendingRegenAt).toBeNull();
    });
  });

  describe("§21 regeneration 不被 health-context unconfirmed 阻塞", () => {
    it("healthContextStatus=unconfirmed + 相关 Record 连入 → 仍 touchPendingRegen（regen 门槛不是问卷完成）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId); // seeds status: "unconfirmed"
      const recordId = await seedLabRecord(userId);
      await connect(decisionId, recordId, userId);

      // 确认 decision 入库时 healthContextStatus 是 unconfirmed
      const before = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
        select: { healthContextStatus: true, pendingRegenAt: true },
      });
      expect(before.healthContextStatus).toBe("unconfirmed");
      expect(before.pendingRegenAt).toBeNull();

      // 相关 Record 触发 onRecordConnected → 写 pendingRegenAt（不被 unconfirmed 阻塞）
      const links = await listByDecision(decisionId);
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      const result = await orch.onRecordConnected({
        decisionId,
        recordRef: {
          id: links[0].healthRecordId,
          kind: links[0].healthRecord.kind,
          documentClass: links[0].healthRecord.documentClass,
          summary: links[0].healthRecord.title,
        },
      });
      expect(result.touched).toBe(true);

      // pending 已写入（regen 已被允许），但 healthContextStatus 仍是 unconfirmed
      const after = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
        select: { healthContextStatus: true, pendingRegenAt: true },
      });
      expect(after.healthContextStatus).toBe("unconfirmed"); // 问卷未确认
      expect(after.pendingRegenAt).not.toBeNull(); // 但 regen pending 已触
    });
  });

  describe("B4 多因 trigger → 取主因 + 单 Snapshot", () => {
    it("多条相关 Record 续期同一 pending → 单次 fire 产出单 Snapshot（trigger=new_record 主因）", async () => {
      const userId = await seedUser();
      const decisionId = await seedHrtDecision(userId);
      // 先建首版
      const orch = new RegenerationOrchestrator({
        synthesizer: makeMockSynthesizer(),
      });
      await orch.runInitialSynthesis(decisionId);
      const initialSnap = await findCurrent(decisionId);

      // 连入 3 份相关 Record（lab 类别）
      const r1 = await seedLabRecord(userId, { title: "lab A" });
      const r2 = await seedLabRecord(userId, { title: "lab B" });
      const r3 = await seedLabRecord(userId, { title: "lab C" });
      for (const rid of [r1, r2, r3]) {
        await connect(decisionId, rid, userId);
        const links = await listByDecision(decisionId);
        const link = links.find((l) => l.healthRecordId === rid)!;
        await orch.onRecordConnected({
          decisionId,
          recordRef: {
            id: link.healthRecordId,
            kind: link.healthRecord.kind,
            documentClass: link.healthRecord.documentClass,
            summary: link.healthRecord.title,
          },
        });
      }

      // 3 次续期 → 仅 1 个 pending 窗口
      const decisionMid = await prisma.decision.findUniqueOrThrow({
        where: { id: decisionId },
      });
      expect(decisionMid.pendingRegenAt).not.toBeNull();

      // 让 pending 过期 → 单次 fire
      await prisma.decision.update({
        where: { id: decisionId },
        data: { pendingRegenAt: new Date(Date.now() - 60_000) },
      });
      const fired = await orch.maybeFirePendingRegen(decisionId);
      expect(fired.fired).toBe(true);

      // 单新 Snapshot（initial 那个变历史）
      const after = await findCurrent(decisionId);
      expect(after?.id).not.toBe(initialSnap?.id);
      expect(after?.changeTrigger).toBe("new_record"); // 主因

      // history 只多 1 条（initial 变历史）
      const history = await prisma.decisionSnapshot.findMany({
        where: { decisionId },
        orderBy: { createdAt: "asc" },
      });
      expect(history.length).toBe(2); // initial + new_record
    });
  });

  it("完整 lazy fire 链路：onRecordConnected → touchPending → 手动过期 → maybeFire → Snapshot", async () => {
    const userId = await seedUser();
    const decisionId = await seedHrtDecision(userId);
    const recordId = await seedLabRecord(userId);

    const synth = makeMockSynthesizer();
    const orch = new RegenerationOrchestrator({ synthesizer: synth });

    // 1. 先建首版（Decision 没有任何 Snapshot）
    await orch.runInitialSynthesis(decisionId);
    const initialSnapshot = await findCurrent(decisionId);
    expect(initialSnapshot).not.toBeNull();

    // 2. 连接新 Record + 触发 onRecordConnected
    await connect(decisionId, recordId, userId);
    const links = await listByDecision(decisionId);
    await orch.onRecordConnected({
      decisionId,
      recordRef: {
        id: links[0].healthRecordId,
        kind: links[0].healthRecord.kind,
        documentClass: links[0].healthRecord.documentClass,
        summary: links[0].healthRecord.title,
      },
    });

    // 3. pending 未过期 → maybeFire 不触发，但状态 = STALE
    const stale = await orch.maybeFirePendingRegen(decisionId);
    expect(stale.fired).toBe(false);
    expect(stale.state).toBe("STALE_UPDATE_AVAILABLE");

    // 4. 手动让 pending 过期
    await prisma.decision.update({
      where: { id: decisionId },
      data: { pendingRegenAt: new Date(Date.now() - 60_000) },
    });

    // 5. maybeFire 触发 → 新 Snapshot（initial 变历史）
    const fired = await orch.maybeFirePendingRegen(decisionId);
    expect(fired.fired).toBe(true);
    const after = await findCurrent(decisionId);
    expect(after?.id).not.toBe(initialSnapshot?.id);
    expect(after?.changeTrigger).toBe("new_record");
  });
});
