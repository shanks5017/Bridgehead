const { supabase } = require('./src/config/db');

async function createTable() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS gov_dam_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dam_name TEXT NOT NULL,
        state_name TEXT,
        district_name TEXT,
        basin TEXT,
        full_capacity_tmc NUMERIC,
        current_level_tmc NUMERIC,
        percent_full NUMERIC,
        inflow_cusecs NUMERIC,
        outflow_cusecs NUMERIC,
        observed_at TIMESTAMPTZ NOT NULL,
        fetched_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(dam_name, observed_at)
      );

      -- Optional RLS
      ALTER TABLE gov_dam_levels ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Public Read Access" ON gov_dam_levels FOR SELECT USING (true);
    `
  });
  console.log('Error:', error);
  console.log('Result:', data);
}

createTable();
