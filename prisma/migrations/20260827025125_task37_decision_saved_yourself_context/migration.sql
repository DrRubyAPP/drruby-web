-- AlterTable
ALTER TABLE "decision" ADD COLUMN     "saved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "yourself_context" TEXT;

-- CreateIndex
CREATE INDEX "decision_user_saved_idx" ON "decision"("user_id", "saved");
