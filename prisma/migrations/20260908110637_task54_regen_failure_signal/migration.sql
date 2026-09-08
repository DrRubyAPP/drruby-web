ALTER TABLE "decision"
  ADD COLUMN "last_regen_failed_at" TIMESTAMPTZ,
  ADD COLUMN "last_regen_failure" JSONB;
