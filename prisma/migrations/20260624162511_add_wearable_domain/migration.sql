-- CreateTable
CREATE TABLE "wearable_connection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "access_token_encrypted" BYTEA,
    "refresh_token_encrypted" BYTEA,
    "connected_at" TIMESTAMPTZ NOT NULL,
    "last_synced_at" TIMESTAMPTZ,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wearable_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wearable_daily" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "record_date" DATE NOT NULL,
    "provider" TEXT NOT NULL,
    "sleep_score" DECIMAL(65,30),
    "deep_sleep_min" INTEGER,
    "hrv_avg" DECIMAL(65,30),
    "resting_hr" INTEGER,
    "skin_temp_delta" DECIMAL(65,30),
    "step_count" INTEGER,
    "glucose_mean" DECIMAL(65,30),
    "glucose_cv" DECIMAL(65,30),
    "glucose_spike_count" INTEGER,
    "data_quality" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wearable_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glucose_stream" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "measured_at" TIMESTAMPTZ NOT NULL,
    "glucose_mgdl" DECIMAL(65,30),
    "trend_arrow" TEXT,
    "cgm_device_serial" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "glucose_stream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wearable_connection_user_id_idx" ON "wearable_connection"("user_id");

-- CreateIndex
CREATE INDEX "wearable_connection_provider_idx" ON "wearable_connection"("provider");

-- CreateIndex
CREATE INDEX "wearable_daily_user_date_idx" ON "wearable_daily"("user_id", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_daily_user_provider_date_uniq" ON "wearable_daily"("user_id", "provider", "record_date");

-- CreateIndex
CREATE INDEX "glucose_stream_user_measured_idx" ON "glucose_stream"("user_id", "measured_at");

-- AddForeignKey
ALTER TABLE "wearable_connection" ADD CONSTRAINT "wearable_connection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_daily" ADD CONSTRAINT "wearable_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucose_stream" ADD CONSTRAINT "glucose_stream_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
