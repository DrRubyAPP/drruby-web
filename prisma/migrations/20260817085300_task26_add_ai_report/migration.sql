-- CreateTable
CREATE TABLE "ai_report" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" JSONB,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_report_user_type_idx" ON "ai_report"("user_id", "type");

-- CreateIndex
CREATE INDEX "ai_report_user_created_idx" ON "ai_report"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_report" ADD CONSTRAINT "ai_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
