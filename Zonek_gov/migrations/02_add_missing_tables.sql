-- 02_add_missing_tables.sql
-- Add tables for the remaining government data fetchers

-- 1. Weather (6-hourly, district-level)
CREATE TABLE IF NOT EXISTS gov_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  temperature_c NUMERIC,
  humidity_pct NUMERIC,
  rainfall_mm NUMERIC,
  wind_speed_kmh NUMERIC,
  wind_direction TEXT,
  weather_condition TEXT,
  forecast_24h JSONB,
  source TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(station_id, observed_at)
);

-- 2. Crop Prices (daily, district-level)
CREATE TABLE IF NOT EXISTS gov_crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  market_name TEXT NOT NULL,
  commodity_name TEXT NOT NULL,
  variety TEXT,
  grade TEXT,
  arrival_quantity NUMERIC, -- in quintals
  min_price NUMERIC, -- INR per quintal
  max_price NUMERIC,
  modal_price NUMERIC,
  price_date DATE,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, market_name, commodity_name, variety, grade, price_date)
);

-- 3. Infrastructure News (6-hourly, state-level)
CREATE TABLE IF NOT EXISTS gov_infrastructure_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  source TEXT, -- e.g., 'PIB', 'The Hindu'
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Jal Jeevan Mission (Water) (weekly, district-level)
CREATE TABLE IF NOT EXISTS gov_jjm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  -- JJM specific fields
  habitation_name TEXT,
  total_habitations INTEGER,
  tap_water_connections INTEGER,
  tap_water_connections_pct NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, habitation_name, fetched_at)
);

-- 5. PMAY Housing (monthly, district-level)
CREATE TABLE IF NOT EXISTS gov_pmay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  -- PMAY specific fields
  sanction_year INTEGER,
  houses_sanctioned INTEGER,
  houses_completed INTEGER,
  houses_occupied INTEGER,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, sanction_year, fetched_at)
);

-- 6. Courts (NJDG) (weekly, district-level)
CREATE TABLE IF NOT EXISTS gov_courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  -- Court specific fields
  case_type TEXT, -- e.g., 'Civil', 'Criminal'
  cases_filed INTEGER,
  cases_disposed INTEGER,
  cases_pending INTEGER,
  clearance_rate NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, case_type, fetched_at)
);

-- 7. Schools (UDISE+) (annual, district-level)
CREATE TABLE IF NOT EXISTS gov_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  district_id UUID REFERENCES gov_districts(id) ON DELETE SET NULL,
  -- School specific fields
  school_name TEXT NOT NULL,
  school_type TEXT, -- e.g., 'Primary', 'Upper Primary', 'Secondary'
  management TEXT, -- e.g., 'Department of Education', 'Tribal Welfare'
  total_enrollment INTEGER,
  boys_enrollment INTEGER,
  girls_enrollment INTEGER,
  teachers_count INTEGER,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(district_id, school_name, fetched_at)
);

-- 8. Elections (ECI) (quarterly, state-level)
CREATE TABLE IF NOT EXISTS gov_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES gov_states(id) ON DELETE SET NULL,
  -- Election specific fields
  constituency_name TEXT NOT NULL,
  constituency_type TEXT, -- e.g., 'Lok Sabha', 'Vidhan Sabha'
  total_electors INTEGER,
  male_electors INTEGER,
  female_electors INTEGER,
  voter_turnout_pct NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, constituency_name, constituency_type, fetched_at)
);