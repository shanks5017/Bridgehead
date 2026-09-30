-- Canonical Database Schema (Phase 1)
-- 
-- This file represents the target schema state.
-- For local development/setup, apply migrations from db/migrations/ in order.

-- One row per real-world company, resolved by CIN/LLPIN
CREATE TABLE companies (
    cin                 TEXT PRIMARY KEY,
    company_name        TEXT NOT NULL,
    company_status      TEXT,
    company_class       TEXT,
    company_category    TEXT,
    incorporation_date  DATE,
    roc                 TEXT,
    state               TEXT,
    registered_address  TEXT,
    authorised_capital  NUMERIC,
    paid_up_capital     NUMERIC,
    nic_code            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for API filters
CREATE INDEX idx_companies_state ON companies(state);
CREATE INDEX idx_companies_company_status ON companies(company_status);
CREATE INDEX idx_companies_nic_code ON companies(nic_code);

-- Raw, immutable snapshot reference — this IS the provenance record
CREATE TABLE raw_ingest (
    id               BIGSERIAL PRIMARY KEY,
    source           TEXT NOT NULL,             -- 'mca_ogd' | 'mca_last30days' | ...
    source_record_id TEXT,
    fetched_at       TIMESTAMPTZ NOT NULL,
    raw_path         TEXT NOT NULL,             -- object storage path to the exact raw file
    raw_fields       JSONB NOT NULL
);

-- Field-level provenance — the core product differentiator
CREATE TABLE field_provenance (
    id                BIGSERIAL PRIMARY KEY,
    cin               TEXT NOT NULL REFERENCES companies(cin),
    field_name        TEXT NOT NULL,             -- e.g. 'company_status'
    field_value       TEXT NOT NULL,
    source            TEXT NOT NULL,             -- 'mca_ogd' | 'mca_last30days'
    raw_ingest_id     BIGINT REFERENCES raw_ingest(id),
    confidence_score  NUMERIC NOT NULL,          -- 0-100 (Phase 1: 80 for both sources)
    last_verified_at  TEXT NOT NULL,
    UNIQUE (cin, field_name, source)
);

-- Index for fast per-company lookups
CREATE INDEX idx_field_provenance_cin ON field_provenance(cin);

-- Append-only change log — never overwrite, always add an event
CREATE TABLE events (
    id            BIGSERIAL PRIMARY KEY,
    cin           TEXT NOT NULL REFERENCES companies(cin),
    event_type    TEXT NOT NULL,              -- 'new_registration' | 'status_change' | ...
    old_value     TEXT,
    new_value     TEXT,
    detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    source        TEXT NOT NULL
);

-- Ingestion run tracking (used by the Platform/Automation role for monitoring)
CREATE TABLE ingest_jobs (
    id            BIGSERIAL PRIMARY KEY,
    source        TEXT NOT NULL,
    started_at    TIMESTAMPTZ NOT NULL,
    finished_at   TIMESTAMPTZ,
    status        TEXT NOT NULL,              -- 'running' | 'success' | 'failed'
    row_count     INTEGER,
    error_message TEXT
);
