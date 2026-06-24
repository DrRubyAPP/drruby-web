-- CreateTable
CREATE TABLE "health_journey" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_session" INTEGER,
    "first_session_date" DATE,
    "latest_session_date" DATE,
    "sleep_baseline_trend" TEXT,
    "hrv_baseline_trend" TEXT,
    "sis_trajectory" TEXT,
    "best_sis_score" DECIMAL(65,30),
    "last_computed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_milestone" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "milestone_value" DECIMAL(65,30),
    "achieved_at" TIMESTAMPTZ,
    "shared_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "record_date" DATE,
    "change_type" TEXT NOT NULL,
    "description" TEXT,
    "started_at" DATE,
    "ended_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lifestyle_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_feed" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "insight_date" DATE,
    "insight_type" TEXT NOT NULL,
    "metric_a" TEXT,
    "metric_b" TEXT,
    "correlation_r" DECIMAL(65,30),
    "message_zh" TEXT,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insight_feed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "health_journey_user_id_key" ON "health_journey"("user_id");

-- CreateIndex
CREATE INDEX "health_milestone_user_type_idx" ON "health_milestone"("user_id", "milestone_type");

-- CreateIndex
CREATE INDEX "health_milestone_session_id_idx" ON "health_milestone"("session_id");

-- CreateIndex
CREATE INDEX "lifestyle_log_user_date_idx" ON "lifestyle_log"("user_id", "record_date");

-- CreateIndex
CREATE INDEX "lifestyle_log_session_id_idx" ON "lifestyle_log"("session_id");

-- CreateIndex
CREATE INDEX "insight_feed_user_date_idx" ON "insight_feed"("user_id", "insight_date");

-- CreateIndex
CREATE INDEX "insight_feed_session_id_idx" ON "insight_feed"("session_id");

-- CreateIndex
CREATE INDEX "insight_feed_type_idx" ON "insight_feed"("insight_type");

-- AddForeignKey
ALTER TABLE "health_journey" ADD CONSTRAINT "health_journey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_milestone" ADD CONSTRAINT "health_milestone_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_milestone" ADD CONSTRAINT "health_milestone_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_log" ADD CONSTRAINT "lifestyle_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_log" ADD CONSTRAINT "lifestyle_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_feed" ADD CONSTRAINT "insight_feed_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_feed" ADD CONSTRAINT "insight_feed_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
