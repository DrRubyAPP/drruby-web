-- AlterTable
ALTER TABLE "decision" ADD COLUMN     "next_check_in_at" TIMESTAMPTZ,
ADD COLUMN     "observe_baseline" JSONB;

-- AlterTable
ALTER TABLE "decision_entry" ADD COLUMN     "direction" TEXT;

-- CreateIndex
CREATE INDEX "decision_next_checkin_idx" ON "decision"("user_id", "next_check_in_at");
