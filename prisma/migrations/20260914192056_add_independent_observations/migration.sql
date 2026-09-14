-- CreateTable
CREATE TABLE "observation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "decision_id" TEXT,
    "title" TEXT NOT NULL,
    "cadence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_entry" (
    "id" TEXT NOT NULL,
    "observation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "health_record_id" TEXT,
    "value" TEXT,
    "unit" TEXT,
    "note" TEXT,
    "observed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "observation_user_status_idx" ON "observation"("user_id", "status");

-- CreateIndex
CREATE INDEX "observation_decision_id_idx" ON "observation"("decision_id");

-- CreateIndex
CREATE INDEX "observation_entry_observation_time_idx" ON "observation_entry"("observation_id", "observed_at");

-- CreateIndex
CREATE INDEX "observation_entry_user_time_idx" ON "observation_entry"("user_id", "observed_at");

-- CreateIndex
CREATE INDEX "observation_entry_record_id_idx" ON "observation_entry"("health_record_id");

-- AddForeignKey
ALTER TABLE "observation" ADD CONSTRAINT "observation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation" ADD CONSTRAINT "observation_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_entry" ADD CONSTRAINT "observation_entry_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_entry" ADD CONSTRAINT "observation_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_entry" ADD CONSTRAINT "observation_entry_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;
