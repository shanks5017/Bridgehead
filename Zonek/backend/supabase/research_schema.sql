-- ============================================================
-- ZONEK — RESEARCH ENGINE SCHEMA EXTENSION
-- Run this in the Supabase SQL Editor (after the main schema.sql)
-- ============================================================

-- ============================================================
-- 1. EXTEND PROFILES TABLE — Founder Onboarding Fields
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_stage        TEXT,            -- 'Idea' | 'Validating' | 'Operating' | 'Scaling'
  ADD COLUMN IF NOT EXISTS primary_city          TEXT,            -- e.g. 'Bangalore'
  ADD COLUMN IF NOT EXISTS business_type_interest TEXT,           -- e.g. 'Cafe', 'Retail', 'SaaS'
  ADD COLUMN IF NOT EXISTS total_budget_range    TEXT,            -- 'Under ₹5L' | '₹5-10L' | '₹10-25L' | '₹25L+'
  ADD COLUMN IF NOT EXISTS founder_experience    TEXT,            -- '0-2 years' | '2-5 years' | '5+ years'
  ADD COLUMN IF NOT EXISTS onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 2. RESEARCH INPUTS TABLE — Every form submission
-- ============================================================
CREATE TABLE IF NOT EXISTS public.research_inputs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Business Identity
  business_name            TEXT,
  business_type            TEXT NOT NULL,
  business_format          TEXT NOT NULL,            -- 'Brick & Mortar' | 'Online' | 'Hybrid' | 'SaaS' | 'Service'
  business_description     TEXT,
  -- Location & Finance
  location                 TEXT NOT NULL,
  total_budget             BIGINT NOT NULL,           -- INR
  pricing_model            TEXT,
  avg_ticket_size          INTEGER,
  -- Market
  target_market            TEXT,
  launch_timeline          TEXT,
  current_stage            TEXT,
  expected_team_size       INTEGER,
  space_required           TEXT,
  -- Strategy
  business_model           TEXT,
  unique_value_proposition TEXT,
  known_competitors        TEXT[],
  differentiators          TEXT[],
  -- Founder
  founder_experience       TEXT,
  target_customer_persona  TEXT,
  primary_channel          TEXT,
  existing_licences        TEXT[],
  -- Report options
  include_financials        BOOLEAN NOT NULL DEFAULT TRUE,
  include_competitors       BOOLEAN NOT NULL DEFAULT TRUE,
  include_marketing         BOOLEAN NOT NULL DEFAULT TRUE,
  include_roadmap           BOOLEAN NOT NULL DEFAULT TRUE,
  include_sops              BOOLEAN NOT NULL DEFAULT TRUE,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. RESEARCH REPORTS TABLE — Full generated report JSON
-- ============================================================
CREATE TABLE IF NOT EXISTS public.research_reports (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_id               UUID REFERENCES public.research_inputs(id) ON DELETE SET NULL,
  -- Display metadata
  report_title           TEXT,                        -- e.g. "Cafe Feasibility — Indiranagar, Bangalore"
  business_type          TEXT,
  location               TEXT,
  budget_inr             BIGINT,
  verdict                TEXT CHECK (verdict IN ('GO', 'CAUTION', 'STOP')),
  -- Full 5-section report
  report_data            JSONB NOT NULL,
  -- Quality & delivery
  firewall_violations    INTEGER NOT NULL DEFAULT 0,
  generation_time_ms     INTEGER,
  pdf_url                TEXT,                        -- Supabase Storage URL after PDF export
  is_starred             BOOLEAN NOT NULL DEFAULT FALSE,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. INDEXES — Fast user history queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_research_inputs_user_id
  ON public.research_inputs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_reports_user_id
  ON public.research_reports (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_reports_verdict
  ON public.research_reports (verdict);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.research_inputs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

-- research_inputs policies
DROP POLICY IF EXISTS "research_inputs_select_own" ON public.research_inputs;
CREATE POLICY "research_inputs_select_own"
  ON public.research_inputs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "research_inputs_insert_own" ON public.research_inputs;
CREATE POLICY "research_inputs_insert_own"
  ON public.research_inputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- research_reports policies
DROP POLICY IF EXISTS "research_reports_select_own" ON public.research_reports;
CREATE POLICY "research_reports_select_own"
  ON public.research_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "research_reports_insert_own" ON public.research_reports;
CREATE POLICY "research_reports_insert_own"
  ON public.research_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "research_reports_update_own" ON public.research_reports;
CREATE POLICY "research_reports_update_own"
  ON public.research_reports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "research_reports_delete_own" ON public.research_reports;
CREATE POLICY "research_reports_delete_own"
  ON public.research_reports FOR DELETE
  USING (auth.uid() = user_id);
