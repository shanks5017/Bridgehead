-- 1. Core Geography
CREATE TABLE IF NOT EXISTS gov_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  lgd_code TEXT,
  abbr TEXT
);

CREATE TABLE IF NOT EXISTS gov_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  UNIQUE(state_id, name)
);

-- 2. Budget
CREATE TABLE IF NOT EXISTS gov_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  revenue JSONB,
  expenditure JSONB,
  fiscal_deficit NUMERIC,
  fiscal_deficit_pct_gsdp NUMERIC,
  gsdp NUMERIC,
  infra_spend_intensity_pct NUMERIC,
  document_url TEXT,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, fiscal_year)
);

-- 3. Crime
CREATE TABLE IF NOT EXISTS gov_crimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES gov_districts(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  ipc JSONB,
  safety_score NUMERIC,
  safety_grade TEXT,
  crime_rate_per_lakh NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, year)
);

-- 4. Schemes
CREATE TABLE IF NOT EXISTS gov_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id TEXT UNIQUE NOT NULL,
  scheme_name TEXT NOT NULL,
  ministry TEXT,
  department TEXT,
  eligibility JSONB,
  applicable_states TEXT[],
  is_national BOOLEAN DEFAULT true,
  category TEXT,
  tags TEXT[],
  benefit JSONB,
  application_url TEXT,
  description TEXT,
  source TEXT,
  last_updated TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Population
CREATE TABLE IF NOT EXISTS gov_population (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES gov_districts(id) ON DELETE CASCADE,
  census_year INTEGER NOT NULL DEFAULT 2011,
  total_population NUMERIC NOT NULL,
  male_population NUMERIC,
  female_population NUMERIC,
  sex_ratio NUMERIC,
  literacy_rate_pct NUMERIC,
  male_literacy_pct NUMERIC,
  female_literacy_pct NUMERIC,
  urban_population NUMERIC,
  rural_population NUMERIC,
  urban_pct NUMERIC,
  total_workers NUMERIC,
  work_participation_rate NUMERIC,
  sc_population NUMERIC,
  st_population NUMERIC,
  sc_pct NUMERIC,
  st_pct NUMERIC,
  area_km2 NUMERIC,
  population_density_per_km2 NUMERIC,
  nhm_projected_year INTEGER,
  nhm_projected_population NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, census_year)
);

-- Row Level Security (RLS) Configuration
-- Assuming we want to read data anonymously but write securely
ALTER TABLE gov_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gov_population ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON gov_states FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gov_districts FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gov_budgets FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gov_crimes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gov_schemes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON gov_population FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies means only service_role can modify data.
