import { NextResponse } from "next/server";
import { detectMaterialChange } from "@/lib/ai/synthesis/material";
import type {
  ConnectedRecordRef,
  HealthContext,
} from "@/lib/ai/synthesis/types";
import { requireUser } from "@/lib/auth/session";
import { decisionRepo, decisionSnapshotRepo } from "@/lib/db";
import { listByDecision } from "@/lib/db/repositories/decisionHealthRecord.repo";
import { AppError, handle } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Check freshness
 * @description 写 freshnessCheckedAt=now，并对 current snapshot 与当前 health context/connected records 做 material-change 检测。响应结构保持稳定
 * @response { freshnessCheckedAt: string, materialChange: boolean }
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const existing = await decisionRepo.findById(id);
  if (!existing || existing.userId !== user.id) {
    throw new AppError("NOT_FOUND", "决策不存在", 404);
  }

  const current = await decisionSnapshotRepo.findCurrent(id);
  const ref = current?.yourselfContextRef as {
    healthContextSnapshot?: HealthContext | null;
    connectedRecordRefs?: ConnectedRecordRef[];
  } | null;
  const prevConnectedRecords = ref?.connectedRecordRefs ?? [];
  const prevHealthContext = ref?.healthContextSnapshot ?? null;
  const links = await listByDecision(id);
  const connectedRecords: ConnectedRecordRef[] = links.map((link) => ({
    id: link.healthRecord.id,
    kind: link.healthRecord.kind,
    documentClass: link.healthRecord.documentClass,
    summary: link.healthRecord.title,
  }));

  const material = detectMaterialChange({
    prevConnectedRecords,
    newConnectedRecords: connectedRecords,
    prevHealthContext,
    newHealthContext: (existing.healthContext as HealthContext | null) ?? null,
    corpusVersionChanged: false,
  });

  const row = await decisionRepo.update(id, { freshnessCheckedAt: new Date() });
  const checkedAt = row.freshnessCheckedAt ?? new Date();
  return NextResponse.json({
    freshnessCheckedAt: checkedAt.toISOString(),
    materialChange: material.material,
  });
});
