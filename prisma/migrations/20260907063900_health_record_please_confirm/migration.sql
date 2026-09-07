-- AlterTable
ALTER TABLE "health_record" ADD COLUMN     "extraction_error" TEXT,
ADD COLUMN     "please_confirm" TEXT[] DEFAULT ARRAY[]::TEXT[];
