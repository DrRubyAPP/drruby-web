import {
  type ChangeTrigger,
  changeTriggerSchema,
  type SynthesisProvenance,
  synthesisProvenanceSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";
import type { DecisionSnapshot, Prisma } from "~prisma/client";

/**
 * task-43 §15/§23 综合快照 repo（Contract D3 独立表）
 *
 * 每次 material synthesis change 产生新行；旧 Current 保留为 Historical Snapshot。
 * - Current = Decision.currentSnapshotId 指向最新行
 * - History = 同 decisionId 下 createdAt DESC（不含 current）
 *
 * yourselfContextRef 存快照时的 Record id + parsedValues 摘要（不只 id），
 * 保证历史可还原（R3，Record 被软删除后历史 Snapshot 引用不悬空）。
 */

export interface SnapshotCreateInput {
  /** §23 快照内容：{ healthContextSnapshot, connectedRecordRefs:[{id,kind,documentClass,summary}] } */
  yourselfContextRef?: Prisma.InputJsonValue | null;
  /** 引用集：[{ type: record|others|science, ref, summary }] */
  sources?: Prisma.InputJsonValue | null;
  /** 引用：[{ label, ref }] */
  citations?: Prisma.InputJsonValue | null;
  /** 综合文本：{ yourself, others, science, combined } */
  synthesis?: Prisma.InputJsonValue | null;
  provenance: SynthesisProvenance;
  changeTrigger: ChangeTrigger;
}

function validate(input: SnapshotCreateInput): void {
  synthesisProvenanceSchema.parse(input.provenance);
  changeTriggerSchema.parse(input.changeTrigger);
}

/** 创建 Snapshot 行。**不**绑 currentSnapshotId（由调用方在事务内调 decisionRepo.bindCurrentSnapshot） */
export async function create(
  decisionId: string,
  input: SnapshotCreateInput,
): Promise<DecisionSnapshot> {
  validate(input);
  return prisma.decisionSnapshot.create({
    data: {
      decisionId,
      yourselfContextRef: input.yourselfContextRef ?? undefined,
      sources: input.sources ?? undefined,
      citations: input.citations ?? undefined,
      synthesis: input.synthesis ?? undefined,
      provenance: input.provenance,
      changeTrigger: input.changeTrigger,
    },
  });
}

/** 按 id 查单个 Snapshot */
export async function findById(id: string): Promise<DecisionSnapshot | null> {
  return prisma.decisionSnapshot.findUnique({ where: { id } });
}

/**
 * 历史快照：同 decisionId 下 createdAt DESC（不含 current）。
 * currentSnapshotId 指向的行**不**出现在历史列表。
 */
export async function listHistoryByDecision(
  decisionId: string,
  opts: { limit?: number } = {},
): Promise<DecisionSnapshot[]> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: { currentSnapshotId: true },
  });
  const currentId = decision?.currentSnapshotId ?? null;

  return prisma.decisionSnapshot.findMany({
    where: {
      decisionId,
      ...(currentId ? { id: { not: currentId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
}

/**
 * Current Snapshot：通过 Decision.currentSnapshotId join 到 decision_snapshot。
 * currentSnapshotId=null（R1 首次打开）返回 null。
 */
export async function findCurrent(
  decisionId: string,
): Promise<DecisionSnapshot | null> {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: { currentSnapshotId: true },
  });
  if (!decision?.currentSnapshotId) return null;
  return prisma.decisionSnapshot.findUnique({
    where: { id: decision.currentSnapshotId },
  });
}
