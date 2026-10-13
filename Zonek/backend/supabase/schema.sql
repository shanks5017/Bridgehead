-- ============================================================
-- ZONEK (BRIDGEHEAD) — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name                TEXT NOT NULL DEFAULT '',
  username                 TEXT NOT NULL UNIQUE,
  user_type                TEXT NOT NULL DEFAULT 'community' CHECK (user_type IN ('entrepreneur', 'community')),
  company_name             TEXT NOT NULL DEFAULT '',
  role                     TEXT NOT NULL DEFAULT '',
  bio                      TEXT NOT NULL DEFAULT '',
  profile_picture_url      TEXT NOT NULL DEFAULT '',
  original_picture_url     TEXT NOT NULL DEFAULT '',
  reputation_score         INTEGER NOT NULL DEFAULT 100,
  deals_completed          INTEGER NOT NULL DEFAULT 0,
  is_verified_entrepreneur BOOLEAN NOT NULL DEFAULT FALSE,
  auth_provider            TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'microsoft')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEMAND POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  description           TEXT NOT NULL,
  location              GEOGRAPHY(POINT, 4326),
  address               TEXT NOT NULL DEFAULT '',
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  images                TEXT[] NOT NULL DEFAULT '{}',
  upvotes               INTEGER NOT NULL DEFAULT 0,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN NOT NULL DEFAULT TRUE,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashtags              TEXT[] NOT NULL DEFAULT '{}',
  urgency_score         INTEGER,
  distance_radius_miles NUMERIC,
  demographics          TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RENTAL POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  category              TEXT NOT NULL,
  description           TEXT NOT NULL,
  location              GEOGRAPHY(POINT, 4326),
  address               TEXT NOT NULL DEFAULT '',
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  images                TEXT[] NOT NULL DEFAULT '{}',
  price                 NUMERIC NOT NULL DEFAULT 0,
  price_per_sqft_yearly NUMERIC,
  square_feet           NUMERIC NOT NULL DEFAULT 0,
  lease_type            TEXT,
  amenities             TEXT[] NOT NULL DEFAULT '{}',
  zoning_code           TEXT,
  phone                 TEXT,
  email                 TEXT,
  collaboration_open    BOOLEAN NOT NULL DEFAULT TRUE,
  status                TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'expired')),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hashtags              TEXT[] NOT NULL DEFAULT '{}',
  upvotes               INTEGER NOT NULL DEFAULT 0,
  
  -- Extra scraped fields
  source_platform       TEXT,
  listing_url           TEXT UNIQUE,
  locality              TEXT,
  rent_per_sqft         NUMERIC,
  floor                 TEXT,
  listing_date          TIMESTAMPTZ,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  furnishing_status     TEXT,
  facing                TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPVOTES (normalized junction tables)
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_upvotes (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demand_post_id UUID NOT NULL REFERENCES demand_posts(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, demand_post_id)
);

CREATE TABLE IF NOT EXISTS rental_upvotes (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rental_post_id UUID NOT NULL REFERENCES rental_posts(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, rental_post_id)
);

-- ============================================================
-- DEMAND COMMENTS (was embedded array in MongoDB)
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_post_id UUID NOT NULL REFERENCES demand_posts(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RENTAL COMMENTS (was embedded array in MongoDB)
-- ============================================================
CREATE TABLE IF NOT EXISTS rental_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_post_id UUID NOT NULL REFERENCES rental_posts(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name    TEXT NOT NULL,
  author_username TEXT,
  author_avatar  TEXT,
  author_badge   TEXT CHECK (author_badge IN ('entrepreneur', 'investor', 'expert')),
  content        TEXT NOT NULL CHECK (char_length(content) <= 1000),
  topic          TEXT NOT NULL DEFAULT 'general',
  hashtags       TEXT[] NOT NULL DEFAULT '{}',
  likes_count    INTEGER NOT NULL DEFAULT 0,
  replies_count  INTEGER NOT NULL DEFAULT 0,
  reposts_count  INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name  TEXT NOT NULL,
  author_avatar TEXT,
  content      TEXT NOT NULL CHECK (char_length(content) <= 500),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY INTERACTIONS (likes / reposts)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_interactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('like', 'repost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, type)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  post_id         UUID,              -- nullable; could be demand or rental id
  last_message    JSONB,             -- { text, sender_id, timestamp, read }
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  role_context    JSONB,             -- { owner_id, seeker_id }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text            TEXT,
  media           JSONB,             -- [{ type, url }]
  read_by         UUID[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Demand posts
CREATE INDEX IF NOT EXISTS idx_demand_posts_location   ON demand_posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_demand_posts_created_at ON demand_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_posts_status     ON demand_posts (status);
CREATE INDEX IF NOT EXISTS idx_demand_posts_created_by ON demand_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_demand_posts_hashtags   ON demand_posts USING GIN (hashtags);

-- Rental posts
CREATE INDEX IF NOT EXISTS idx_rental_posts_location   ON rental_posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_rental_posts_created_at ON rental_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rental_posts_status     ON rental_posts (status);
CREATE INDEX IF NOT EXISTS idx_rental_posts_created_by ON rental_posts (created_by);
CREATE INDEX IF NOT EXISTS idx_rental_posts_hashtags   ON rental_posts USING GIN (hashtags);

-- Comments
CREATE INDEX IF NOT EXISTS idx_demand_comments_post  ON demand_comments (demand_post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_rental_comments_post  ON rental_comments (rental_post_id, created_at ASC);

-- Community
CREATE INDEX IF NOT EXISTS idx_community_posts_topic  ON community_posts (topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_time   ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags   ON community_posts USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_community_comments     ON community_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_interactions ON community_interactions (post_id, user_id);

-- Conversations & Messages
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_updated      ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation      ON messages (conversation_id, created_at ASC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_demand_posts
  BEFORE UPDATE ON demand_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_rental_posts
  BEFORE UPDATE ON rental_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_demand_comments
  BEFORE UPDATE ON demand_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_rental_comments
  BEFORE UPDATE ON rental_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_community_posts
  BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_community_comments
  BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_messages
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, username, user_type, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'community'),
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_upvotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_upvotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Demand posts
DROP POLICY IF EXISTS "demand_posts_select_all" ON demand_posts;
CREATE POLICY "demand_posts_select_all"     ON demand_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_posts_insert_auth" ON demand_posts;
CREATE POLICY "demand_posts_insert_auth"    ON demand_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "demand_posts_update_owner" ON demand_posts;
CREATE POLICY "demand_posts_update_owner"   ON demand_posts FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "demand_posts_delete_owner" ON demand_posts;
CREATE POLICY "demand_posts_delete_owner"   ON demand_posts FOR DELETE USING (auth.uid() = created_by);

-- Rental posts
DROP POLICY IF EXISTS "rental_posts_select_all" ON rental_posts;
CREATE POLICY "rental_posts_select_all"     ON rental_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_posts_insert_auth" ON rental_posts;
CREATE POLICY "rental_posts_insert_auth"    ON rental_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rental_posts_update_owner" ON rental_posts;
CREATE POLICY "rental_posts_update_owner"   ON rental_posts FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "rental_posts_delete_owner" ON rental_posts;
CREATE POLICY "rental_posts_delete_owner"   ON rental_posts FOR DELETE USING (auth.uid() = created_by);

-- Upvotes
DROP POLICY IF EXISTS "demand_upvotes_select" ON demand_upvotes;
CREATE POLICY "demand_upvotes_select"  ON demand_upvotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_upvotes_manage" ON demand_upvotes;
CREATE POLICY "demand_upvotes_manage"  ON demand_upvotes FOR ALL  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "rental_upvotes_select" ON rental_upvotes;
CREATE POLICY "rental_upvotes_select"  ON rental_upvotes FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_upvotes_manage" ON rental_upvotes;
CREATE POLICY "rental_upvotes_manage"  ON rental_upvotes FOR ALL  USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "demand_comments_select" ON demand_comments;
CREATE POLICY "demand_comments_select"  ON demand_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "demand_comments_insert" ON demand_comments;
CREATE POLICY "demand_comments_insert"  ON demand_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rental_comments_select" ON rental_comments;
CREATE POLICY "rental_comments_select"  ON rental_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "rental_comments_insert" ON rental_comments;
CREATE POLICY "rental_comments_insert"  ON rental_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Community posts
DROP POLICY IF EXISTS "community_posts_select" ON community_posts;
CREATE POLICY "community_posts_select"  ON community_posts FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;
CREATE POLICY "community_posts_insert"  ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "community_posts_update" ON community_posts;
CREATE POLICY "community_posts_update"  ON community_posts FOR UPDATE USING (auth.uid() = author_id);

-- Community comments
DROP POLICY IF EXISTS "community_comments_select" ON community_comments;
CREATE POLICY "community_comments_select"  ON community_comments FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "community_comments_insert" ON community_comments;
CREATE POLICY "community_comments_insert"  ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Community interactions
DROP POLICY IF EXISTS "interactions_select" ON community_interactions;
CREATE POLICY "interactions_select"  ON community_interactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "interactions_manage" ON community_interactions;
CREATE POLICY "interactions_manage"  ON community_interactions FOR ALL  USING (auth.uid() = user_id);

-- Conversations
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select"  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert"  ON conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update"  ON conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- Messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select"  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
  ));
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert"  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
    )
  );
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update"  ON messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
  ));


-- ============================================================
-- ZONEK GOV-DATA (GOVERNMENT DATA ENGINE TABLES)
-- ============================================================


-- ── MERGED FROM: 01_init_supabase.sql ──
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


-- ── MERGED FROM: 02_add_missing_tables.sql ──
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

-- ── MERGED FROM: 03_add_dam_levels.sql ──
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


-- ── MERGED FROM: 04_alter_pmay_add_columns.sql ──
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
