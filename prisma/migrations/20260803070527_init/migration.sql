-- CreateTable
CREATE TABLE "user_account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL,
    "google_sub" TEXT,
    "role" TEXT NOT NULL,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'active',
    "name" TEXT,
    "image" TEXT,
    "last_login_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_baseline" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skin_type" TEXT,
    "fitzpatrick_scale" TEXT,
    "hormonal_status" TEXT,
    "menopause_year" INTEGER,
    "concern_goals" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_baseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hormonal_status_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hormonal_status_log_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "timeline_event" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "decision_id" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "source" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "timeline_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "source" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "trend" TEXT,
    "measured_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL,
    "brief" JSONB,
    "decided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_entry" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status_snapshot" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_study" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "irb_number" TEXT,
    "recruitment_status" TEXT NOT NULL,
    "fields" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "research_study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_enrollment" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "arm" TEXT,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMPTZ,
    "withdrawn_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "study_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_setting" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "consent_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_insight" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tag" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "accent" TEXT,
    "label" TEXT,
    "value" TEXT,
    "caption" TEXT,
    "tone" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "body_insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_scan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scanned_at" TIMESTAMPTZ NOT NULL,
    "headline" TEXT NOT NULL,
    "zones" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "skin_scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hormone_reading" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "marker" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "note" TEXT,
    "measured_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hormone_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribution" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_at" TIMESTAMPTZ,
    "withdrawn_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_record" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "object_key" TEXT,
    "ocr_status" TEXT NOT NULL DEFAULT 'pending',
    "parsed_values" JSONB,
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "health_record_id" TEXT,
    "object_key" TEXT NOT NULL,
    "caption" TEXT,
    "taken_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_end" TIMESTAMPTZ,
    "canceled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey" (
    "id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "decision_type" TEXT,
    "goal" TEXT,
    "concern" TEXT,
    "timing_context" TEXT,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "source_type" TEXT NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "withdrawn_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_update" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post" (
    "id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_expert" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "community_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_reply" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "body" TEXT NOT NULL,
    "is_expert" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "community_reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_task" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "decision_id" TEXT,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "follow_up_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_tier" TEXT,
    "enabled_modules" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_staff" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinic_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorization" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "authorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorization_audit" (
    "id" TEXT NOT NULL,
    "authorization_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorization_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_archive" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "inflammatory_score" DECIMAL(65,30),
    "pigmentation_score" DECIMAL(65,30),
    "texture_score" DECIMAL(65,30),
    "trend" TEXT,
    "captured_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "skin_archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "staff_user_id" TEXT,
    "referral_id" TEXT,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_report" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT,
    "status" TEXT NOT NULL,
    "draft_content" JSONB,
    "final_content" JSONB,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinic_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "flagged_metrics" JSONB,
    "note" TEXT,
    "requested_service" TEXT,
    "status" TEXT NOT NULL,
    "commission_amount" DECIMAL(65,30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborator_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "institution" TEXT,
    "title" TEXT,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "collaborator_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principal_investigator" TEXT,
    "irb_number" TEXT,
    "recruitment_status" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "research_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dua_status" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "version" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_doc" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "governance_doc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_google_sub_key" ON "user_account"("google_sub");

-- CreateIndex
CREATE INDEX "user_account_status_deleted_at_idx" ON "user_account"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "user_baseline_user_id_key" ON "user_baseline"("user_id");

-- CreateIndex
CREATE INDEX "hormonal_status_log_user_id_idx" ON "hormonal_status_log"("user_id");

-- CreateIndex
CREATE INDEX "wearable_connection_user_id_idx" ON "wearable_connection"("user_id");

-- CreateIndex
CREATE INDEX "wearable_connection_provider_idx" ON "wearable_connection"("provider");

-- CreateIndex
CREATE INDEX "wearable_daily_user_date_idx" ON "wearable_daily"("user_id", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "wearable_daily_user_provider_date_uniq" ON "wearable_daily"("user_id", "provider", "record_date");

-- CreateIndex
CREATE INDEX "timeline_event_user_occurred_idx" ON "timeline_event"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "timeline_event_decision_id_idx" ON "timeline_event"("decision_id");

-- CreateIndex
CREATE INDEX "signal_user_measured_idx" ON "signal"("user_id", "measured_at");

-- CreateIndex
CREATE INDEX "decision_user_status_idx" ON "decision"("user_id", "status");

-- CreateIndex
CREATE INDEX "decision_entry_decision_occurred_idx" ON "decision_entry"("decision_id", "occurred_at");

-- CreateIndex
CREATE INDEX "decision_entry_user_id_idx" ON "decision_entry"("user_id");

-- CreateIndex
CREATE INDEX "research_study_recruitment_idx" ON "research_study"("recruitment_status");

-- CreateIndex
CREATE INDEX "study_enrollment_user_id_idx" ON "study_enrollment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_enrollment_study_user_uniq" ON "study_enrollment"("study_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_setting_user_key_uniq" ON "consent_setting"("user_id", "key");

-- CreateIndex
CREATE INDEX "body_insight_user_kind_idx" ON "body_insight"("user_id", "kind");

-- CreateIndex
CREATE INDEX "skin_scan_user_scanned_idx" ON "skin_scan"("user_id", "scanned_at");

-- CreateIndex
CREATE INDEX "experiment_user_status_idx" ON "experiment"("user_id", "status");

-- CreateIndex
CREATE INDEX "hormone_reading_user_id_idx" ON "hormone_reading"("user_id");

-- CreateIndex
CREATE INDEX "contribution_user_id_idx" ON "contribution"("user_id");

-- CreateIndex
CREATE INDEX "health_record_user_recorded_idx" ON "health_record"("user_id", "recorded_at");

-- CreateIndex
CREATE INDEX "photo_user_id_idx" ON "photo"("user_id");

-- CreateIndex
CREATE INDEX "photo_health_record_id_idx" ON "photo"("health_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_user_id_key" ON "subscription"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripe_subscription_id_key" ON "subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_user_id_idx" ON "subscription"("user_id");

-- CreateIndex
CREATE INDEX "journey_decision_type_idx" ON "journey"("decision_type");

-- CreateIndex
CREATE INDEX "journey_source_type_idx" ON "journey"("source_type");

-- CreateIndex
CREATE INDEX "journey_update_journey_version_idx" ON "journey_update"("journey_id", "version");

-- CreateIndex
CREATE INDEX "community_post_author_idx" ON "community_post"("author_user_id");

-- CreateIndex
CREATE INDEX "community_reply_post_id_idx" ON "community_reply"("post_id");

-- CreateIndex
CREATE INDEX "notification_user_read_idx" ON "notification"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "follow_up_task_user_status_idx" ON "follow_up_task"("user_id", "status");

-- CreateIndex
CREATE INDEX "clinic_staff_user_id_idx" ON "clinic_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_staff_clinic_user_uniq" ON "clinic_staff"("clinic_id", "user_id");

-- CreateIndex
CREATE INDEX "authorization_clinic_id_idx" ON "authorization"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "authorization_user_clinic_uniq" ON "authorization"("user_id", "clinic_id");

-- CreateIndex
CREATE INDEX "authorization_audit_auth_created_idx" ON "authorization_audit"("authorization_id", "created_at");

-- CreateIndex
CREATE INDEX "skin_archive_clinic_patient_idx" ON "skin_archive"("clinic_id", "patient_user_id");

-- CreateIndex
CREATE INDEX "appointment_clinic_scheduled_idx" ON "appointment"("clinic_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointment_patient_id_idx" ON "appointment"("patient_user_id");

-- CreateIndex
CREATE INDEX "clinic_report_clinic_status_idx" ON "clinic_report"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "clinic_report_patient_id_idx" ON "clinic_report"("patient_user_id");

-- CreateIndex
CREATE INDEX "referral_clinic_status_idx" ON "referral"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "referral_from_user_id_idx" ON "referral"("from_user_id");

-- CreateIndex
CREATE INDEX "invoice_clinic_status_idx" ON "invoice"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "invoice_patient_id_idx" ON "invoice"("patient_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collaborator_profile_user_id_key" ON "collaborator_profile"("user_id");

-- CreateIndex
CREATE INDEX "protocol_project_id_idx" ON "protocol"("project_id");

-- CreateIndex
CREATE INDEX "governance_doc_category_idx" ON "governance_doc"("category");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_baseline" ADD CONSTRAINT "user_baseline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hormonal_status_log" ADD CONSTRAINT "hormonal_status_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_connection" ADD CONSTRAINT "wearable_connection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wearable_daily" ADD CONSTRAINT "wearable_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal" ADD CONSTRAINT "signal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_entry" ADD CONSTRAINT "decision_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_enrollment" ADD CONSTRAINT "study_enrollment_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "research_study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_enrollment" ADD CONSTRAINT "study_enrollment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_setting" ADD CONSTRAINT "consent_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_insight" ADD CONSTRAINT "body_insight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_scan" ADD CONSTRAINT "skin_scan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hormone_reading" ADD CONSTRAINT "hormone_reading_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_record" ADD CONSTRAINT "health_record_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey" ADD CONSTRAINT "journey_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_update" ADD CONSTRAINT "journey_update_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post" ADD CONSTRAINT "community_post_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reply" ADD CONSTRAINT "community_reply_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_reply" ADD CONSTRAINT "community_reply_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_task" ADD CONSTRAINT "follow_up_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_staff" ADD CONSTRAINT "clinic_staff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_staff" ADD CONSTRAINT "clinic_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization" ADD CONSTRAINT "authorization_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization" ADD CONSTRAINT "authorization_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authorization_audit" ADD CONSTRAINT "authorization_audit_authorization_id_fkey" FOREIGN KEY ("authorization_id") REFERENCES "authorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_archive" ADD CONSTRAINT "skin_archive_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_archive" ADD CONSTRAINT "skin_archive_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_report" ADD CONSTRAINT "clinic_report_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_report" ADD CONSTRAINT "clinic_report_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_profile" ADD CONSTRAINT "collaborator_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "research_project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Raw SQL 约束（Prisma schema 无法表达）
-- user_account.email 大小写不敏感唯一（红线 §0.3.8）
--   避免 A@x.com 与 a@x.com 重复注册（亦保障 Google 账号合并）
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "user_account_email_lower_uniq"
  ON "user_account" (lower("email"));
