-- task-43: 综合结果层（Contract §15–§26）
-- 1) decision 表加 5 列：current_snapshot_id / health_context / health_context_status
--    / health_context_confirmed_at / pending_regen_at
-- 2) 建 decision_snapshot 表（§23 快照，D3 独立表，R1 不回填 current_snapshot_id）
-- 3) 索引：decision(user_id, pending_regen_at) lazy fire 扫描；
--    decision_snapshot(decision_id, created_at) 历史倒序
-- 注意：新字段全 nullable，存量 Decision 不破坏；current_snapshot_id 留 null，
--       首次打开 Decision 时 orchestrator 检测 null → 触发 initial synthesis（R1）
-- 类型：Prisma schema 期望 TEXT（非 VARCHAR）；JSONB；TIMESTAMPTZ

-- 1) decision 加列（全 nullable，兼容存量）
ALTER TABLE "decision" ADD COLUMN IF NOT EXISTS "current_snapshot_id" TEXT;
ALTER TABLE "decision" ADD COLUMN IF NOT EXISTS "health_context" JSONB;
ALTER TABLE "decision" ADD COLUMN IF NOT EXISTS "health_context_status" TEXT;
ALTER TABLE "decision" ADD COLUMN IF NOT EXISTS "health_context_confirmed_at" TIMESTAMPTZ;
ALTER TABLE "decision" ADD COLUMN IF NOT EXISTS "pending_regen_at" TIMESTAMPTZ;

-- 2) lazy fire 索引：(user_id, pending_regen_at) 检索到期 regen
CREATE INDEX IF NOT EXISTS "decision_pending_regen_idx"
  ON "decision"("user_id","pending_regen_at");

-- 3) 建 decision_snapshot
CREATE TABLE "decision_snapshot" (
  "id" TEXT NOT NULL,
  "decision_id" TEXT NOT NULL,
  "yourself_context_ref" JSONB,
  "sources" JSONB,
  "citations" JSONB,
  "synthesis" JSONB,
  "provenance" TEXT NOT NULL,
  "change_trigger" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "decision_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "decision_snapshot_decision_created_idx"
  ON "decision_snapshot"("decision_id","created_at");

ALTER TABLE "decision_snapshot" ADD CONSTRAINT "decision_snapshot_decision_id_fkey"
  FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
