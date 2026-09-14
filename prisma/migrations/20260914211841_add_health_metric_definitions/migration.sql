-- AlterTable
ALTER TABLE "health_record" ADD COLUMN     "metric_code" TEXT NOT NULL DEFAULT 'other';

-- CreateTable
CREATE TABLE "health_vital_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "value_type" TEXT NOT NULL DEFAULT 'numeric',
    "canonical_unit" TEXT,
    "is_chartable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_vital_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_medication_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_medication_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_treatment_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_treatment_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_symptom_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_symptom_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_checkup_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_checkup_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_lab_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "value_type" TEXT NOT NULL DEFAULT 'numeric',
    "canonical_unit" TEXT,
    "is_chartable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_lab_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateTable
CREATE TABLE "health_imaging_metric_definition" (
    "metric_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "health_imaging_metric_definition_pkey" PRIMARY KEY ("metric_code")
);

-- CreateIndex
CREATE INDEX "health_record_user_metric_recorded_idx" ON "health_record"("user_id", "metric_code", "recorded_at");

-- Every catalog accepts `other`, allowing us to retain unsupported user input
-- without claiming a false canonical identity. Vitals also includes the small
-- set needed by the first latest-value and trend experiences.
INSERT INTO "health_vital_metric_definition" ("metric_code", "display_name", "aliases", "value_type", "canonical_unit", "is_chartable", "updated_at") VALUES
  ('other', 'Other vital', ARRAY[]::TEXT[], 'numeric', NULL, false, CURRENT_TIMESTAMP),
  ('blood_pressure', 'Blood pressure', ARRAY['bp', 'morning blood pressure']::TEXT[], 'compound', 'mmHg', true, CURRENT_TIMESTAMP),
  ('body_weight', 'Body weight', ARRAY['weight', 'weigh-in']::TEXT[], 'numeric', 'kg', true, CURRENT_TIMESTAMP),
  ('body_height', 'Body height', ARRAY['height']::TEXT[], 'numeric', 'cm', false, CURRENT_TIMESTAMP),
  ('heart_rate', 'Heart rate', ARRAY['resting heart rate', 'rhr']::TEXT[], 'numeric', 'bpm', true, CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_medication_metric_definition" ("metric_code", "display_name", "aliases", "updated_at") VALUES
  ('other', 'Other medication', ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_treatment_metric_definition" ("metric_code", "display_name", "aliases", "updated_at") VALUES
  ('other', 'Other treatment', ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_symptom_metric_definition" ("metric_code", "display_name", "aliases", "updated_at") VALUES
  ('other', 'Other symptom', ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_checkup_metric_definition" ("metric_code", "display_name", "aliases", "updated_at") VALUES
  ('other', 'Other checkup', ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_lab_metric_definition" ("metric_code", "display_name", "aliases", "value_type", "canonical_unit", "is_chartable", "updated_at") VALUES
  ('other', 'Other lab result', ARRAY[]::TEXT[], 'numeric', NULL, false, CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

INSERT INTO "health_imaging_metric_definition" ("metric_code", "display_name", "aliases", "updated_at") VALUES
  ('other', 'Other imaging result', ARRAY[]::TEXT[], CURRENT_TIMESTAMP)
ON CONFLICT ("metric_code") DO NOTHING;

-- PostgreSQL cannot express a foreign key which dynamically selects a target
-- table from health_record.kind. Enforce that polymorphic reference here.
CREATE OR REPLACE FUNCTION "validate_health_record_metric_code"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kind = 'vitals' THEN
    PERFORM 1 FROM "health_vital_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'medication' THEN
    PERFORM 1 FROM "health_medication_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'treatment' THEN
    PERFORM 1 FROM "health_treatment_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'symptom' THEN
    PERFORM 1 FROM "health_symptom_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'checkup' THEN
    PERFORM 1 FROM "health_checkup_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'lab' THEN
    PERFORM 1 FROM "health_lab_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSIF NEW.kind = 'imaging' THEN
    PERFORM 1 FROM "health_imaging_metric_definition" WHERE "metric_code" = NEW.metric_code;
  ELSE
    RAISE EXCEPTION 'Unsupported health_record kind: %', NEW.kind;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'metric_code % is not defined for health_record kind %', NEW.metric_code, NEW.kind
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "health_record_metric_code_valid"
BEFORE INSERT OR UPDATE OF "kind", "metric_code" ON "health_record"
FOR EACH ROW EXECUTE FUNCTION "validate_health_record_metric_code"();
