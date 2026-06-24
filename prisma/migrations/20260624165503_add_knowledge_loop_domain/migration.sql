-- CreateTable
CREATE TABLE "expert_source" (
    "id" TEXT NOT NULL,
    "expert_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "title" TEXT,
    "domain" TEXT,
    "verdict" TEXT,
    "embedding_ref" TEXT,
    "version" TEXT,
    "licensed_at" DATE,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "expert_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_rag_log" (
    "id" TEXT NOT NULL,
    "insight_id" TEXT NOT NULL,
    "query_embedding_ref" TEXT,
    "source_ids_retrieved" TEXT[],
    "llm_model_version" TEXT,
    "prompt_version" TEXT,
    "generated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insight_rag_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sis_response_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "study_week" INTEGER,
    "sis_delta_shown" DECIMAL(65,30),
    "action_taken" TEXT NOT NULL,
    "new_product_name" TEXT,
    "response_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sis_response_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_protocol_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "avg_mcs_score" DECIMAL(65,30),
    "consecutive_low_mcs_count" INTEGER,
    "protocol_version" TEXT,
    "last_adapted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_protocol_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_validation_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "visit_date" DATE,
    "model_version" TEXT,
    "clinic_r2" DECIMAL(65,30),
    "clinic_r5" DECIMAL(65,30),
    "retraining_flagged" BOOLEAN,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "model_validation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_insight" (
    "id" TEXT NOT NULL,
    "skin_type" TEXT NOT NULL,
    "fitzpatrick_scale" TEXT NOT NULL,
    "intervention_category" TEXT NOT NULL,
    "sample_n" INTEGER,
    "sis_delta_mean" DECIMAL(65,30),
    "sis_delta_p25" DECIMAL(65,30),
    "sis_delta_p75" DECIMAL(65,30),
    "confidence_level" TEXT,
    "computed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cohort_insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expert_source_expert_idx" ON "expert_source"("expert_name");

-- CreateIndex
CREATE INDEX "expert_source_domain_idx" ON "expert_source"("domain");

-- CreateIndex
CREATE INDEX "expert_source_active_idx" ON "expert_source"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "insight_rag_log_insight_id_key" ON "insight_rag_log"("insight_id");

-- CreateIndex
CREATE INDEX "sis_response_log_user_response_idx" ON "sis_response_log"("user_id", "response_at");

-- CreateIndex
CREATE INDEX "sis_response_log_session_week_idx" ON "sis_response_log"("session_id", "study_week");

-- CreateIndex
CREATE UNIQUE INDEX "user_protocol_config_user_id_key" ON "user_protocol_config"("user_id");

-- CreateIndex
CREATE INDEX "model_validation_log_session_visit_idx" ON "model_validation_log"("session_id", "visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_insight_skin_fitz_cat_uniq" ON "cohort_insight"("skin_type", "fitzpatrick_scale", "intervention_category");

-- AddForeignKey
ALTER TABLE "insight_rag_log" ADD CONSTRAINT "insight_rag_log_insight_id_fkey" FOREIGN KEY ("insight_id") REFERENCES "insight_feed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sis_response_log" ADD CONSTRAINT "sis_response_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sis_response_log" ADD CONSTRAINT "sis_response_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_protocol_config" ADD CONSTRAINT "user_protocol_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_validation_log" ADD CONSTRAINT "model_validation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_validation_log" ADD CONSTRAINT "model_validation_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
