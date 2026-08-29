-- task-42: My Health 摄入闭环（Contract §2/§12-§14）
-- 1) 新建 health_source（原件层）
-- 2) health_record 加列：source_id (1:1 unique) / status / document_class / confidence
-- 3) 存量数据迁移：从 health_record 拆出 HealthSource + 回填 source_id + ocr_status→status 映射
-- 4) source_id 非空 + unique + FK
-- 5) 新建 health_record_revision（append-only 修正历史）
-- 6) 新建 decision_health_record（Decision ⇄ HealthRecord 关联，软删除留痕）
-- 注意：旧字段 source/object_key/ocr_status 保留兼容（不删）
-- 类型：Prisma 7 schema 期望 TEXT（非 VARCHAR）；@updatedAt 不设 DB default

-- 1) 建 health_source
CREATE TABLE "health_source" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime" TEXT,
  "hash" TEXT,
  "object_key" TEXT,
  "storage_lifecycle" TEXT,
  "provenance" JSONB,
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_source_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "health_source_user_uploaded_idx" ON "health_source"("user_id","uploaded_at");
ALTER TABLE "health_source"
  ADD CONSTRAINT "health_source_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) health_record 加列（source_id 允许空过渡，迁移后改非空）
ALTER TABLE "health_record" ADD COLUMN IF NOT EXISTS "source_id" TEXT;
ALTER TABLE "health_record" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SOURCE_UPLOADED';
ALTER TABLE "health_record" ADD COLUMN IF NOT EXISTS "document_class" TEXT;
ALTER TABLE "health_record" ADD COLUMN IF NOT EXISTS "confidence" TEXT;

-- 3a) 存量有原件的 health_record（object_key 或 source 非空）→ 拆出 HealthSource
INSERT INTO "health_source" ("id","user_id","file_name","object_key","uploaded_at","created_at","updated_at")
SELECT
  CONCAT('src_', "id") AS id,
  "user_id",
  COALESCE("title", 'untitled') AS file_name,
  "object_key",
  "created_at" AS uploaded_at,
  "created_at",
  "updated_at"
FROM "health_record"
WHERE "object_key" IS NOT NULL OR "source" IS NOT NULL;

-- 3b) 存量有原件的 health_record：回填 source_id + ocr_status→status 映射
UPDATE "health_record" r
SET "source_id" = CONCAT('src_', r."id"),
    "status" = CASE
      WHEN r."ocr_status" IN ('done','manual') THEN 'CONFIRMED'
      WHEN r."ocr_status" IN ('pending','processing') THEN 'PROCESSING'
      ELSE 'PROCESSING'
    END
WHERE r."object_key" IS NOT NULL OR r."source" IS NOT NULL;

-- 3c) 存量无原件的 health_record（手动录入）→ 也建 Source + status=CONFIRMED
INSERT INTO "health_source" ("id","user_id","file_name","uploaded_at","created_at","updated_at")
SELECT
  CONCAT('src_', "id"),
  "user_id",
  COALESCE("title", 'manual entry'),
  "created_at",
  "created_at",
  "updated_at"
FROM "health_record"
WHERE "object_key" IS NULL AND "source" IS NULL;

UPDATE "health_record" r
SET "source_id" = CONCAT('src_', r."id"),
    "status" = 'CONFIRMED'
WHERE r."object_key" IS NULL AND r."source" IS NULL;

-- 4) source_id 非空 + unique + FK
ALTER TABLE "health_record" ALTER COLUMN "source_id" SET NOT NULL;
ALTER TABLE "health_record" ADD CONSTRAINT "health_record_source_id_key" UNIQUE ("source_id");
ALTER TABLE "health_record" ADD CONSTRAINT "health_record_source_id_fkey"
  FOREIGN KEY ("source_id") REFERENCES "health_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "health_record_user_status_idx" ON "health_record"("user_id","status");

-- 5) 建 health_record_revision（append-only 修正历史，Contract §14 provenance）
CREATE TABLE "health_record_revision" (
  "id" TEXT NOT NULL,
  "record_id" TEXT NOT NULL,
  "parsed_values_snapshot" JSONB NOT NULL,
  "diff_summary" TEXT,
  "corrected_by" TEXT NOT NULL,
  "corrected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_record_revision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "health_record_revision_record_corrected_idx" ON "health_record_revision"("record_id","corrected_at");
ALTER TABLE "health_record_revision" ADD CONSTRAINT "health_record_revision_record_id_fkey"
  FOREIGN KEY ("record_id") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6) 建 decision_health_record（Decision ⇄ HealthRecord 关联，Contract §2 显式 Connect）
CREATE TABLE "decision_health_record" (
  "id" TEXT NOT NULL,
  "decision_id" TEXT NOT NULL,
  "health_record_id" TEXT NOT NULL,
  "connected_by" TEXT NOT NULL,
  "connected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "decision_health_record_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "decision_health_record_decision_idx" ON "decision_health_record"("decision_id");
CREATE INDEX "decision_health_record_record_idx" ON "decision_health_record"("health_record_id");
ALTER TABLE "decision_health_record" ADD CONSTRAINT "decision_health_record_decision_id_fkey"
  FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_health_record" ADD CONSTRAINT "decision_health_record_health_record_id_fkey"
  FOREIGN KEY ("health_record_id") REFERENCES "health_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7) Prisma @updatedAt 不期望 DB-level DEFAULT，移除 health_source.updated_at 的 default
--    （其他 model 的 created_at/updated_at 也无 default；保持一致）
ALTER TABLE "health_source" ALTER COLUMN "updated_at" DROP DEFAULT;

