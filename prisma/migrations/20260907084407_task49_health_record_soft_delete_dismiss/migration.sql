-- AlterTable
ALTER TABLE "health_record" ADD COLUMN     "connect_dismissed_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_at" TIMESTAMPTZ;
