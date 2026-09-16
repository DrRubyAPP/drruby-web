-- AlterTable
ALTER TABLE "health_record" ADD COLUMN     "observation_id" TEXT;

-- Backfill the earlier JSON-only link, but only when its observation belongs
-- to the same user as the health record. Invalid legacy JSON remains unlinked.
UPDATE "health_record" AS record
SET "observation_id" = record."parsed_values"->>'observationId'
FROM "observation" AS observation
WHERE record."observation_id" IS NULL
  AND jsonb_typeof(record."parsed_values") = 'object'
  AND observation."id" = record."parsed_values"->>'observationId'
  AND observation."user_id" = record."user_id";

-- CreateIndex
CREATE INDEX "health_record_observation_recorded_idx" ON "health_record"("observation_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "health_record" ADD CONSTRAINT "health_record_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "observation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
