-- Skin condition is a qualitative, member-observed symptom metric. Keeping it
-- in the symptom catalog lets it use the existing health_record validation and
-- trend indexes without introducing a body-area-specific record kind.
INSERT INTO "health_symptom_metric_definition" (
  "metric_code",
  "display_name",
  "aliases",
  "updated_at"
) VALUES (
  'skin_condition',
  'Skin condition',
  ARRAY['skin condition', 'skin-condition', 'skin health']::TEXT[],
  CURRENT_TIMESTAMP
)
ON CONFLICT ("metric_code") DO UPDATE
SET
  "display_name" = EXCLUDED."display_name",
  "aliases" = EXCLUDED."aliases",
  "updated_at" = CURRENT_TIMESTAMP;
