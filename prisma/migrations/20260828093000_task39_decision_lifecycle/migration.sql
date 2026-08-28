-- 1) Decision：新增三维列（lifecycle 带默认，backfill 前先加）
ALTER TABLE "decision"
  ADD COLUMN "lifecycle"             TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "decision_kind"         TEXT,
  ADD COLUMN "outcome"               TEXT,
  ADD COLUMN "next_step"             TEXT,
  ADD COLUMN "last_user_activity_at" TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2) backfill：旧 status → lifecycle/decisionKind；activity ← updatedAt
--    幂等守卫（B2）：仅处理尚未迁移（decision_kind IS NULL）的行，重跑不二次改写
UPDATE "decision" SET
  "lifecycle" = CASE "status"
    WHEN 'decided' THEN 'DECIDED'
    ELSE 'ACTIVE'
  END,
  "decision_kind"         = 'unconfirmed',
  "last_user_activity_at" = "updated_at"
WHERE "decision_kind" IS NULL;

-- 3) DecisionEntry：statusSnapshot → lifecycleSnapshot（先改名，再就地转值）
ALTER TABLE "decision_entry" RENAME COLUMN "status_snapshot" TO "lifecycle_snapshot";
UPDATE "decision_entry" SET "lifecycle_snapshot" = CASE "lifecycle_snapshot"
    WHEN 'decided'     THEN 'DECIDED'
    WHEN 'considering' THEN 'ACTIVE'
    WHEN 'in-progress' THEN 'ACTIVE'
    WHEN 'paused'      THEN 'ACTIVE'
    ELSE "lifecycle_snapshot"
  END
WHERE "lifecycle_snapshot" IN ('decided','considering','in-progress','paused');

-- 4) drop 旧 status 列 + 旧索引；建 activity 索引
DROP INDEX IF EXISTS "decision_user_status_idx";
ALTER TABLE "decision" DROP COLUMN "status";
CREATE INDEX "decision_user_activity_idx" ON "decision"("user_id", "last_user_activity_at");
