-- 03_add_dam_levels.sql
-- Add table for Dam Levels (CWC Reservoir Data)

CREATE TABLE IF NOT EXISTS gov_dam_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  dam_name TEXT NOT NULL,
  basin TEXT,
  full_capacity_tmc NUMERIC,
  current_level_tmc NUMERIC,
  percent_full NUMERIC,
  inflow_cusecs NUMERIC,
  outflow_cusecs NUMERIC,
  source TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dam_name, observed_at)
);

-- Optional RLS
ALTER TABLE gov_dam_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON gov_dam_levels FOR SELECT USING (true);
