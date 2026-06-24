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
    "last_login_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_google_sub_key" ON "user_account"("google_sub");

-- CreateIndex
CREATE INDEX "user_account_status_deleted_at_idx" ON "user_account"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_baseline_user_id_key" ON "user_baseline"("user_id");

-- CreateIndex
CREATE INDEX "hormonal_status_log_user_id_idx" ON "hormonal_status_log"("user_id");

-- AddForeignKey
ALTER TABLE "user_baseline" ADD CONSTRAINT "user_baseline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hormonal_status_log" ADD CONSTRAINT "hormonal_status_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
