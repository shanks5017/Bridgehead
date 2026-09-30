-- 04_alter_pmay_add_columns.sql
-- Add missing columns to gov_pmay for monthly progress tracking

ALTER TABLE gov_pmay
  ADD COLUMN IF NOT EXISTS as_of_date DATE,
  ADD COLUMN IF NOT EXISTS houses_under_construction INTEGER,
  ADD COLUMN IF NOT EXISTS completion_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS construction_activity_index INTEGER;

-- Note: The existing columns are:
-- sanction_year INTEGER,
-- houses_sanctioned INTEGER,
-- houses_completed INTEGER,
-- houses_occupied INTEGER,
-- source TEXT,
-- fetched_at TIMESTAMPTZ DEFAULT NOW(),

-- We also want to adjust the unique constraint to include as_of_date for monthly updates.
-- Drop old constraint and add new one.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE table_name = 'gov_pmay' AND constraint_name = 'gov_pmay_district_id_sanction_year_fetched_at_key') THEN
        ALTER TABLE gov_pmay DROP CONSTRAINT gov_pmay_district_id_sanction_year_fetched_at_key;
    END IF;
END $$;

ALTER TABLE gov_pmay
  ADD CONSTRAINT gov_pmay_district_id_as_of_date_unique UNIQUE (district_id, as_of_date);