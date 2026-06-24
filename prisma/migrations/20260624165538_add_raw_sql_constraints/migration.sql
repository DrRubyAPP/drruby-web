-- =============================================================================
-- Raw SQL 约束补充（Prisma schema 无法表达的部分）
-- 参考：a_docs/drruby-docs/mvp2/data-model-2.md
-- =============================================================================

-- 1. user_account.email 大小写不敏感唯一（红线 §0.3.8）
--    避免A@x.com 与 a@x.com 重复注册（亦保障 Google 账号合并）
CREATE UNIQUE INDEX IF NOT EXISTS "user_account_email_lower_uniq"
  ON "user_account" (lower("email"));

-- 2. study_session 每用户仅一条 active（§7 唯一约束）
--    Prisma @@unique 不支持 WHERE，必须 raw SQL partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS "study_session_one_active"
  ON "study_session" ("user_id")
  WHERE "status" = 'active' AND "deleted_at" IS NULL;

-- 3. image_info 条件必填（§8：dermoscope 采集必须关联 device_capture）
--    capture_device='dermoscope' → device_id NOT NULL
ALTER TABLE "image_info"
  ADD CONSTRAINT "image_info_device_id_required_for_dermoscope"
  CHECK ("capture_device" <> 'dermoscope' OR "device_id" IS NOT NULL);

-- 4. glucose_stream 分区策略预留注释（本阶段单表）
--    Phase 2 按 (user_id, measured_at) 范围分区，预估 26周x1000用户 ≈ 5200万行
COMMENT ON TABLE "glucose_stream" IS 'MVP 单表；Phase 2 按 (user_id, measured_at) 范围分区，预估 26周x1000用户 ≈ 5200万行';

-- =============================================================================
-- 注：以下约束需 pgvector 扩展，本地开发暂未启用（Docker Hub 不可达）
-- 生产环境切 pgvector/pgvector:pg16 镜像后，取消注释并执行：
--
-- -- pgvector 扩展
-- CREATE EXTENSION IF NOT EXISTS vector;
--
-- -- expert_source.embedding_ref 从 text ALTER 为 vector(1536)
-- ALTER TABLE "expert_source"
--   ALTER COLUMN "embedding_ref" TYPE vector(1536) USING NULL;
--
-- -- 向量索引（HNSW，cosine 距离，适配 1536 维 OpenAI embedding）
-- CREATE INDEX IF NOT EXISTS "expert_source_embedding_ref_idx"
--   ON "expert_source" USING hnsw ("embedding_ref" vector_cosine_ops);
-- =============================================================================
