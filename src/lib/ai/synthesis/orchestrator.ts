/**
 * task-43 RegenerationOrchestrator（Contract §18/§22/D6）
 *
 * 串联 D2 → D6 → D4 → T4(synthesize) → T3(createSnapshot+bind) 全链路：
 * 1. onRecordConnected：D2 判定相关 → touchPendingRegen（D6 续期）；不相关 no-op
 * 2. maybeFirePendingRegen（lazy on open）：pending 已过 → runRegeneration；
 *    未过 → STALE_UPDATE_AVAILABLE；为空 → no-op
 * 3. runRegeneration：gather input → D4 detectMaterialChange → material 则
 *    synthesize + create snapshot + bindCurrentSnapshot（$transaction）；非 material 仅 clearPending
 * 4. runInitialSynthesis：currentSnapshotId=null 时建首版（trigger=initial，provenance=initial）
 *
 * 设计：注入 Synthesizer 便于测试 mock；其他 deps 用真实 repos（默认）。
 */
import { getDecisionCorpus } from "@/config/decision-corpus";
import type { AiState, ChangeTrigger } from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import * as decisionRepo from "@/lib/db/repositories/decision.repo";
import { listByDecision } from "@/lib/db/repositories/decisionHealthRecord.repo";
import * as snapshotRepo from "@/lib/db/repositories/decisionSnapshot.repo";
import { detectMaterialChange } from "./material";
import { type DecisionRef, isRelevant } from "./relevance";
import type { ConnectedRecordRef, Synthesizer } from "./types";

export interface OrchestratorDeps {
  synthesizer: Synthesizer;
  /** 注入决策 repo（默认真实 decisionRepo）；测试可替换 */
  decisionRepo?: typeof decisionRepo;
  /** 注入快照 repo（默认真实 snapshotRepo） */
  snapshotRepo?: typeof snapshotRepo;
}

export interface OnRecordConnectedInput {
  decisionId: string;
  recordRef: ConnectedRecordRef;
}

export interface OnRecordConnectedResult {
  touched: boolean;
}

export interface MaybeFireResult {
  fired: boolean;
  /** 触发后的 AiState（yourself 视角；rule-based） */
  state?: AiState;
  /** pending 未过窗口时返回到期时间 */
  pendingUntil?: Date;
}

export interface RunRegenInput {
  trigger: ChangeTrigger;
  /** 显式标记 corpus 版本变（B2）；不传则按 false 处理 */
  corpusVersionChanged?: boolean;
}

export interface RunRegenResult {
  material: boolean;
  /** material=true 时返回新 Snapshot id */
  snapshotId?: string;
  /** 非 material 时返回 reason */
  reason?: string;
}

export interface RunInitialResult {
  /** 是否新建（false=已有 currentSnapshotId，idempotent） */
  created: boolean;
  snapshotId?: string;
}

/**
 * 把 prisma Decision 行 + connected Records 组成 SynthesisInput.
 * 内部辅助函数，orchestrator 各方法共用。
 */
async function gatherSynthesisInput(
  decisionId: string,
  trigger: ChangeTrigger,
  deps: OrchestratorDeps,
): Promise<{
  input: import("./types").SynthesisInput;
  connectedRecords: ConnectedRecordRef[];
}> {
  const dRepo = deps.decisionRepo ?? decisionRepo;
  const decision = await prisma.decision.findUniqueOrThrow({
    where: { id: decisionId },
  });

  // 取 connected Records（task-42 listByDecision 含 healthRecord + healthSource）
  const links = await listByDecision(decisionId);
  const connectedRecords: ConnectedRecordRef[] = links.map((link) => ({
    id: link.healthRecord.id,
    kind: link.healthRecord.kind,
    documentClass: link.healthRecord.documentClass,
    // V1：用 title 作 summary；后续可改成从 parsedValues 构造更结构化的摘要
    summary: link.healthRecord.title,
  }));

  const corpus = getDecisionCorpus(
    decision.topicSlug as Parameters<typeof getDecisionCorpus>[0],
  );
  const corpusOthers = [
    ...corpus.others.helpful,
    ...corpus.others.difficult,
  ].join(" ");
  const corpusScience = corpus.science.benefits[0]?.text ?? "";

  const input: import("./types").SynthesisInput = {
    decision: {
      id: decision.id,
      question: decision.question,
      topicSlug: decision.topicSlug,
      topic: decision.topic,
      healthContext:
        (decision.healthContext as import("./types").HealthContext | null) ??
        null,
      yourselfContext: decision.yourselfContext,
    },
    connectedRecords,
    corpus: {
      others: corpusOthers,
      science: corpusScience,
      othersVersion: "v1",
      scienceVersion: "v1",
    },
    changeTrigger: trigger,
  };

  return { input, connectedRecords };
}

/**
 * 把当前 Snapshot 的 yourselfContextRef（含 connectedRecordRefs）取出来作 prevSnapshot ref。
 * 用于 D4 detectMaterialChange 的 prevConnectedRecords。
 */
async function getPrevSnapshotRecords(
  decisionId: string,
): Promise<ConnectedRecordRef[]> {
  const current = await snapshotRepo.findCurrent(decisionId);
  if (!current?.yourselfContextRef) return [];
  const ref = current.yourselfContextRef as {
    connectedRecordRefs?: ConnectedRecordRef[];
  };
  return ref?.connectedRecordRefs ?? [];
}

export class RegenerationOrchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  /**
   * 新 Record 连入时调用（由 decisionHealthRecordRepo.connect 路径触发）。
   * D2 判定相关 → touchPendingRegen（D6 续期）；不相关 no-op。
   */
  async onRecordConnected(
    input: OnRecordConnectedInput,
  ): Promise<OnRecordConnectedResult> {
    const dRepo = this.deps.decisionRepo ?? decisionRepo;
    const decision = await prisma.decision.findUniqueOrThrow({
      where: { id: input.decisionId },
      select: {
        id: true,
        topicSlug: true,
        topic: true,
        healthContext: true,
        yourselfContext: true,
      },
    });

    const decisionRef: DecisionRef = {
      id: decision.id,
      topicSlug: decision.topicSlug,
      topic: decision.topic,
      healthContext:
        (decision.healthContext as import("./types").HealthContext | null) ??
        null,
      yourselfContext: decision.yourselfContext,
    };

    if (!isRelevant(input.recordRef, decisionRef)) {
      return { touched: false };
    }

    await dRepo.touchPendingRegen(input.decisionId);
    return { touched: true };
  }

  /**
   * 用户打开 Decision 时调用（GET /decisions/[id] / GET /decisions/[id]/ai-state）。
   * - pendingRegenAt 非空且已过 → runRegeneration（material 判定 + 建 Snapshot + clear pending）
   * - pendingRegenAt 非空且未过 → STALE_UPDATE_AVAILABLE（返回 pendingUntil）
   * - pendingRegenAt 为空 → no-op
   */
  async maybeFirePendingRegen(decisionId: string): Promise<MaybeFireResult> {
    const dRepo = this.deps.decisionRepo ?? decisionRepo;
    const pending = await dRepo.getPendingRegen(decisionId);
    if (!pending) return { fired: false };

    const now = Date.now();
    if (pending.getTime() > now) {
      return {
        fired: false,
        state: "STALE_UPDATE_AVAILABLE",
        pendingUntil: pending,
      };
    }

    // 窗口已过 → fire regeneration
    await this.runRegeneration(decisionId, { trigger: "new_record" });
    return { fired: true, state: "READY" };
  }

  /**
   * 执行 regeneration（material 判定 + 建 Snapshot）。
   * - material：gather input → synthesize → $transaction(create snapshot + bind currentSnapshotId + clear pending)
   * - 非 material：仅 clearPendingRegen（B1）
   *
   * 注：trigger 默认 new_record；其他 trigger 由调用方指定。
   * corpusVersionChanged 由调用方按需传（B2 静态语料下默认 false）。
   */
  async runRegeneration(
    decisionId: string,
    input: RunRegenInput,
  ): Promise<RunRegenResult> {
    const sRepo = this.deps.snapshotRepo ?? snapshotRepo;
    const { input: synthInput, connectedRecords } = await gatherSynthesisInput(
      decisionId,
      input.trigger,
      this.deps,
    );

    const prevConnectedRecords = await getPrevSnapshotRecords(decisionId);
    const decision = await prisma.decision.findUniqueOrThrow({
      where: { id: decisionId },
    });

    const materialResult = detectMaterialChange({
      prevConnectedRecords,
      newConnectedRecords: connectedRecords,
      prevHealthContext: (await getPrevHealthContext(decisionId)) ?? null,
      newHealthContext:
        (decision.healthContext as import("./types").HealthContext | null) ??
        null,
      corpusVersionChanged: input.corpusVersionChanged ?? false,
    });

    if (!materialResult.material) {
      // B1：非 material → clear pending，不建 Snapshot
      await decisionRepo.clearPendingRegen(decisionId);
      return { material: false, reason: materialResult.reason };
    }

    // material → synthesize + 事务性 create snapshot + bind + clear pending
    const synth = this.deps.synthesizer;
    const result = await synth.synthesize(synthInput);

    // yourselfContextRef：快照时 Record id + summary（R3 历史可还原）
    const yourselfContextRef = {
      healthContextSnapshot: synthInput.decision.healthContext ?? null,
      connectedRecordRefs: connectedRecords.map((r) => ({
        id: r.id,
        kind: r.kind,
        documentClass: r.documentClass,
        summary: r.summary,
      })),
    };

    const snapshot = await prisma.$transaction(async (tx) => {
      const created = await tx.decisionSnapshot.create({
        data: {
          decisionId,
          yourselfContextRef,
          sources: result.sources as never,
          citations: result.citations as never,
          synthesis: result.synthesis as never,
          provenance: result.provenance,
          changeTrigger: input.trigger,
        },
      });
      await tx.decision.update({
        where: { id: decisionId },
        data: {
          currentSnapshotId: created.id,
          pendingRegenAt: null,
        },
      });
      return created;
    });

    return { material: true, snapshotId: snapshot.id };
  }

  /**
   * R1：首次打开 Decision（currentSnapshotId=null）时建首版 Snapshot。
   * trigger=initial，provenance=initial。
   * 幂等：已有 currentSnapshotId 则不重建。
   */
  async runInitialSynthesis(decisionId: string): Promise<RunInitialResult> {
    const sRepo = this.deps.snapshotRepo ?? snapshotRepo;
    const existing = await sRepo.findCurrent(decisionId);
    if (existing) {
      return { created: false, snapshotId: existing.id };
    }

    const { input: synthInput, connectedRecords } = await gatherSynthesisInput(
      decisionId,
      "initial",
      this.deps,
    );
    const synth = this.deps.synthesizer;
    const result = await synth.synthesize(synthInput);

    const yourselfContextRef = {
      healthContextSnapshot: synthInput.decision.healthContext ?? null,
      connectedRecordRefs: connectedRecords.map((r) => ({
        id: r.id,
        kind: r.kind,
        documentClass: r.documentClass,
        summary: r.summary,
      })),
    };

    const snapshot = await prisma.$transaction(async (tx) => {
      const created = await tx.decisionSnapshot.create({
        data: {
          decisionId,
          yourselfContextRef,
          sources: result.sources as never,
          citations: result.citations as never,
          synthesis: result.synthesis as never,
          provenance: "initial",
          changeTrigger: "initial",
        },
      });
      await tx.decision.update({
        where: { id: decisionId },
        data: { currentSnapshotId: created.id },
      });
      return created;
    });

    return { created: true, snapshotId: snapshot.id };
  }
}

/**
 * 从 prev Snapshot 的 yourselfContextRef.healthContextSnapshot 取 healthContext。
 * 用于 D4 detectMaterialChange 的 prevHealthContext。
 */
async function getPrevHealthContext(
  decisionId: string,
): Promise<import("./types").HealthContext | null> {
  const current = await snapshotRepo.findCurrent(decisionId);
  if (!current?.yourselfContextRef) return null;
  const ref = current.yourselfContextRef as {
    healthContextSnapshot?: import("./types").HealthContext;
  };
  return ref?.healthContextSnapshot ?? null;
}

// 显式 re-export 便于上层 route 调用
export type { ChangeTrigger };
