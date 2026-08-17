-- CreateTable
CREATE TABLE "treatment" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "staff_user_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "amount" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "scheduled_at" TIMESTAMPTZ,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activity" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_user_id" TEXT NOT NULL,
    "staff_user_id" TEXT,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "due_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "crm_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treatment_clinic_status_idx" ON "treatment"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "treatment_patient_id_idx" ON "treatment"("patient_user_id");

-- CreateIndex
CREATE INDEX "crm_activity_clinic_status_idx" ON "crm_activity"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "crm_activity_patient_id_idx" ON "crm_activity"("patient_user_id");

-- AddForeignKey
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activity" ADD CONSTRAINT "crm_activity_patient_user_id_fkey" FOREIGN KEY ("patient_user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
