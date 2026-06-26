-- Automatic follow-up system: distinguish auto-generated follow-ups and track
-- their position in the cadence so the engine can advance the chain idempotently.

ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sequence_no    SMALLINT;

-- Fast lookup of an enquiry's auto follow-ups (used by the reconciler every run).
CREATE INDEX IF NOT EXISTS idx_fu_auto ON follow_ups(enquiry_id, auto_generated);
