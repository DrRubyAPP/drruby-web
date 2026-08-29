-- 1) Decision：新增 freshness gate 时间戳（可空；Reopen 不写、Check now 才写）
ALTER TABLE "decision"
  ADD COLUMN IF NOT EXISTS "freshness_checked_at" TIMESTAMPTZ;

-- 2) DecisionEntry：新增 kind（区分 observation / archived_outcome）+ synthesis（归档 brief 深拷贝）
ALTER TABLE "decision_entry"
  ADD COLUMN IF NOT EXISTS "kind" TEXT,
  ADD COLUMN IF NOT EXISTS "synthesis" JSONB;
