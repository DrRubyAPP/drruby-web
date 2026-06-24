-- CreateTable
CREATE TABLE "study_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_date" DATE,
    "questionnaire_at" TIMESTAMPTZ NOT NULL,
    "current_week" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "paused_at" TIMESTAMPTZ,
    "resumed_at" TIMESTAMPTZ,
    "total_paused_day" INTEGER NOT NULL DEFAULT 0,
    "preferred_capture_window" TEXT,
    "intervention_side" TEXT NOT NULL,
    "control_side" TEXT NOT NULL,
    "consent_at" TIMESTAMPTZ NOT NULL,
    "washout_status" TEXT NOT NULL,
    "baseline_asymmetry_flag" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "study_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_info" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER NOT NULL,
    "s3_object_key" TEXT NOT NULL,
    "captured_at" TIMESTAMPTZ NOT NULL,
    "mcs_level" TEXT,
    "lighting_score" TEXT,
    "anatomical_site" TEXT,
    "face_side" TEXT NOT NULL,
    "device_id" TEXT,
    "capture_device" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "image_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_capture" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER,
    "face_side" TEXT NOT NULL,
    "device_serial" TEXT,
    "s3_raw_path" TEXT,
    "derm_magnification" TEXT,
    "capture_quality" TEXT,
    "bluetooth_rssi" INTEGER,
    "captured_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "device_capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_vector" (
    "id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER NOT NULL,
    "face_side" TEXT NOT NULL,
    "pigmentation_index" DECIMAL(65,30),
    "erythema_score" DECIMAL(65,30),
    "pore_density" DECIMAL(65,30),
    "texture_uniformity" DECIMAL(65,30),
    "model_version" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feature_vector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sis_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER NOT NULL,
    "sis_intervention" DECIMAL(65,30),
    "sis_control" DECIMAL(65,30),
    "sis_delta" DECIMAL(65,30),
    "mcs_lowest" TEXT,
    "capture_count" INTEGER,
    "status" TEXT NOT NULL,
    "computed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sis_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "face_side" TEXT NOT NULL,
    "product_name" TEXT,
    "category" TEXT NOT NULL,
    "dose" TEXT,
    "regime_start_date" DATE NOT NULL,
    "regime_end_date" DATE,
    "frequency" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "intervention_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confounder_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER NOT NULL,
    "record_date" DATE NOT NULL,
    "menstrual_day" INTEGER,
    "sleep_score_manual" DECIMAL(65,30),
    "uv_exposure_hour" DECIMAL(65,30),
    "hydration_level" DECIMAL(65,30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "confounder_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_record" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "study_week" INTEGER,
    "face_side" TEXT NOT NULL,
    "elastometry_r2" DECIMAL(65,30),
    "elastometry_r5" DECIMAL(65,30),
    "clinic_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinic_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_session_user_status_idx" ON "study_session"("user_id", "status");

-- CreateIndex
CREATE INDEX "study_session_user_deleted_idx" ON "study_session"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "image_info_session_week_idx" ON "image_info"("session_id", "study_week");

-- CreateIndex
CREATE INDEX "image_info_user_captured_idx" ON "image_info"("user_id", "captured_at");

-- CreateIndex
CREATE INDEX "image_info_device_id_idx" ON "image_info"("device_id");

-- CreateIndex
CREATE INDEX "device_capture_session_week_idx" ON "device_capture"("session_id", "study_week");

-- CreateIndex
CREATE INDEX "device_capture_user_id_idx" ON "device_capture"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_vector_image_id_key" ON "feature_vector"("image_id");

-- CreateIndex
CREATE INDEX "feature_vector_session_week_side_idx" ON "feature_vector"("session_id", "study_week", "face_side");

-- CreateIndex
CREATE INDEX "feature_vector_user_id_idx" ON "feature_vector"("user_id");

-- CreateIndex
CREATE INDEX "sis_history_user_computed_idx" ON "sis_history"("user_id", "computed_at");

-- CreateIndex
CREATE UNIQUE INDEX "sis_history_session_week_uniq" ON "sis_history"("session_id", "study_week");

-- CreateIndex
CREATE INDEX "intervention_log_session_side_idx" ON "intervention_log"("session_id", "face_side");

-- CreateIndex
CREATE INDEX "intervention_log_category_idx" ON "intervention_log"("category");

-- CreateIndex
CREATE INDEX "confounder_log_session_week_idx" ON "confounder_log"("session_id", "study_week");

-- CreateIndex
CREATE UNIQUE INDEX "confounder_log_session_date_uniq" ON "confounder_log"("session_id", "record_date");

-- CreateIndex
CREATE INDEX "clinic_record_user_visit_idx" ON "clinic_record"("user_id", "visit_date");

-- CreateIndex
CREATE INDEX "clinic_record_clinic_id_idx" ON "clinic_record"("clinic_id");

-- CreateIndex
CREATE INDEX "wearable_daily_session_id_idx" ON "wearable_daily"("session_id");

-- AddForeignKey
ALTER TABLE "wearable_daily" ADD CONSTRAINT "wearable_daily_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_session" ADD CONSTRAINT "study_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_info" ADD CONSTRAINT "image_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_info" ADD CONSTRAINT "image_info_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_info" ADD CONSTRAINT "image_info_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_capture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capture" ADD CONSTRAINT "device_capture_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capture" ADD CONSTRAINT "device_capture_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_vector" ADD CONSTRAINT "feature_vector_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "image_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_vector" ADD CONSTRAINT "feature_vector_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_vector" ADD CONSTRAINT "feature_vector_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sis_history" ADD CONSTRAINT "sis_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sis_history" ADD CONSTRAINT "sis_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_log" ADD CONSTRAINT "intervention_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_log" ADD CONSTRAINT "intervention_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confounder_log" ADD CONSTRAINT "confounder_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confounder_log" ADD CONSTRAINT "confounder_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_record" ADD CONSTRAINT "clinic_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_record" ADD CONSTRAINT "clinic_record_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
