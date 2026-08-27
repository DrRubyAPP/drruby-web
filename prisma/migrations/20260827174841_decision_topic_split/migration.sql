-- AlterTable
ALTER TABLE "decision" ADD COLUMN     "topic" TEXT,
ADD COLUMN     "topic_slug" TEXT;

-- CreateIndex
CREATE INDEX "decision_user_topic_slug_idx" ON "decision"("user_id", "topic_slug");

-- backfill：旧 type（实体）→ topic/topic_slug/type（粗粒度）
-- 单条 UPDATE 内 RHS 全读旧值（Postgres 语义），三处引用 "type" 均为原值。
-- WHERE 守卫保证幂等：只处理仍为实体值的行；重跑时 type 已变粗粒度，不再命中。
UPDATE "decision" SET
  "topic_slug" = "type",
  "topic" = CASE "type"
    WHEN 'thermage'  THEN 'Thermage'
    WHEN 'ultherapy' THEN 'Ultherapy'
    WHEN 'botox'     THEN 'Botox'
    WHEN 'laser'     THEN 'Laser'
    WHEN 'filler'    THEN 'Filler'
    WHEN 'hrt'       THEN 'HRT'
    WHEN 'skincare'  THEN 'Skincare'
    WHEN 'clinic'    THEN 'Clinic'
  END,
  "type" = CASE "type"
    WHEN 'thermage'  THEN 'procedure'
    WHEN 'ultherapy' THEN 'procedure'
    WHEN 'botox'     THEN 'procedure'
    WHEN 'laser'     THEN 'procedure'
    WHEN 'filler'    THEN 'procedure'
    WHEN 'hrt'       THEN 'medication'
    WHEN 'skincare'  THEN 'product'
    WHEN 'clinic'    THEN 'not_sure'
  END
WHERE "type" IN
  ('thermage','ultherapy','botox','laser','filler','hrt','skincare','clinic');
