# Database Schema

Owned by: Data Modeling Engineer. This is the target shape — build the **Phase 1** tables
first, leave the rest as documented-but-not-built.

## Phase 1 tables (build now)

```sql
-- One row per real-world company, resolved by CIN/LLPIN
CREATE TABLE companies (
    cin                 TEXT PRIMARY KEY,
    company_name        TEXT NOT NULL,
    company_status       TEXT,
    company_class        TEXT,
    company_category    TEXT,
    incorporation_date  DATE,
    roc                 TEXT,
    state                TEXT,
    registered_address    TEXT,
    authorised_capital  NUMERIC,
    paid_up_capital       NUMERIC,
    nic_code             TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw, immutable snapshot reference — this IS the provenance record
CREATE TABLE raw_ingest (
    id              BIGSERIAL PRIMARY KEY,
    source          TEXT NOT NULL,             -- 'mca_ogd' | 'mca_last30days' | ...
    source_record_id TEXT,
    fetched_at      TIMESTAMPTZ NOT NULL,
    raw_path        TEXT NOT NULL,              -- object storage path to the exact raw file
    raw_fields      JSONB NOT NULL
);

-- Field-level provenance — the core product differentiator, do not skip this
CREATE TABLE field_provenance (
    id                BIGSERIAL PRIMARY KEY,
    cin               TEXT NOT NULL REFERENCES companies(cin),
    field_name        TEXT NOT NULL,             -- e.g. 'company_status'
    field_value       TEXT NOT NULL,
    source            TEXT NOT NULL,             -- 'mca_ogd' | 'mca_last30days'
    raw_ingest_id     BIGINT REFERENCES raw_ingest(id),
    confidence_score  NUMERIC NOT NULL,           -- 0-100
    last_verified_at TIMESTAMPTZ NOT NULL,
    UNIQUE (cin, field_name, source)
);

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
    id           BIGSERIAL PRIMARY KEY,
    source       TEXT NOT NULL,
    started_at   TIMESTAMPTZ NOT NULL,
    finished_at  TIMESTAMPTZ,
    status       TEXT NOT NULL,               -- 'running' | 'success' | 'failed'
    row_count    INTEGER,
    error_message TEXT
);
```

## Later tables (do not build yet — documented for future phases)

- `directors` + `company_directors` join table — needed once director/network data is added
- `gst_entities`, `udyam_entities` — one table per Phase 2 source, joined to `companies` via CIN
  where a GSTIN/PAN link can be established
- `sources` reference table (source_id, reliability_tier) — only needed once source count grows
  past a handful and confidence scoring needs to reference source-level reliability, not just
  per-field scores

## Confidence scoring rule (Phase 1)

At Phase 1, only one source exists per field, so confidence scoring is simple:
- `mca_last30days` (monthly batch): confidence 80
- `mca_ogd` (bulk, freshness unverified): confidence 80

This will get more interesting once a second source can corroborate or conflict with the first
— that's a Phase 2 problem, not a Phase 1 one. Don't over-engineer the scoring formula now.
