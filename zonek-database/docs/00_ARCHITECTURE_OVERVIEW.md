# Zonek Data Engine — Architecture Overview

## Purpose

This is the **data acquisition + normalization + verification engine** for Zonek Intelligence.
It has one job: take raw Indian government business-registry data, turn it into a clean,
deduplicated, source-cited database of verified business entities.

This document is the entry point. Every other document in this set defines one slice of the
system in enough detail that a coding agent can build that slice without needing the human to
re-explain context.

## Non-negotiable design principles

1. **Provenance over completeness.** Every stored field must be traceable to the exact source
   record and date it came from. A field with no known source does not get displayed as fact.
2. **Deterministic entity resolution first, fuzzy matching second, LLM last.** CIN/LLPIN is the
   hard primary key. Never resolve two entities as the same company using an LLM guess alone.
3. **Source isolation.** One adapter per data source. A broken/rate-limited/changed source must
   never take down ingestion of any other source or block already-ingested data from being served.
4. **Build in phases, ship Phase 1 fully before starting Phase 2.** Do not build nine adapters
   at once. See `05_PHASE_1_MVP_SCOPE.md` for exactly what "Phase 1 done" means.
5. **No premature infrastructure.** No Kafka, no graph database, no browser-automation cluster
   until Phase 1 (batch, single source, low volume) is running in production and the team has
   hit an actual scaling wall. Start with Postgres + a scheduled GitHub Action.

## System shape

```
Government Sources (MCA OGD bulk file, MCA "last 30 days" Excel)
        │
        ▼
  ACQUISITION LAYER        → one adapter per source, isolated, idempotent
        │
        ▼
  STAGING (raw snapshots)  → object storage or a Postgres "raw_ingest" table,
        │                     verbatim, never mutated — this IS the provenance record
        ▼
  NORMALIZATION LAYER      → name/address/date cleanup, NIC code mapping
        │
        ▼
  ENTITY RESOLUTION        → CIN/LLPIN as primary key, dedupe, merge
        │
        ▼
  VERIFICATION/CONFIDENCE  → per-field source + confidence + last_verified_date
        │
        ▼
  CANONICAL STORE (Postgres) → companies, field_provenance, events
        │
        ▼
  API LAYER (FastAPI, read-only for now)
```

## Tech stack (Phase 1)

- **Language:** Python 3.11+
- **Database:** PostgreSQL (use your existing Supabase/Postgres setup)
- **Scheduling/automation:** GitHub Actions (cron-triggered workflows) — no separate worker
  infra needed at this scale
- **Queue:** none yet. A Postgres `ingest_jobs` status table is enough at Phase 1 volume.
  Do not introduce Redis Streams/Kafka until adapter count and volume justify it.
- **API:** FastAPI, read-only endpoints over the canonical store
- **Storage for raw snapshots:** local/S3-compatible object storage; a flat dated folder
  structure is fine at Phase 1 volume (e.g. `raw/mca_ogd/2026-08-30.csv`)

## Repository layout

```
zonek-data-engine/
├── adapters/
│   ├── base.py                  # Adapter interface — every source implements this
│   └── mca_ogd/
│       ├── fetch.py
│       ├── parse.py
│       └── README.md            # Source-specific notes: URL, fields, cadence, license
├── pipeline/
│   ├── normalize.py
│   ├── entity_resolution.py
│   └── confidence.py
├── db/
│   ├── schema.sql
│   └── migrations/
├── api/
│   └── main.py                  # FastAPI app, read endpoints only
├── .github/
│   └── workflows/
│       └── ingest_mca_ogd.yml
├── docs/                        # this document set lives here
└── tests/
```

## Document index (read in this order)

1. `00_ARCHITECTURE_OVERVIEW.md` — this file
2. `01_TEAM_ROLES_AND_OWNERSHIP.md` — who (which agent role) owns which directory
3. `02_DATA_SOURCE_SPECS.md` — exact source URLs, fields, cadence, licensing, output contract
4. `03_DATABASE_SCHEMA.md` — full target schema, Phase 1 vs later marked explicitly
5. `04_PIPELINE_AND_AUTOMATION_SPEC.md` — adapter contract, GitHub Actions workflow spec
6. `05_PHASE_1_MVP_SCOPE.md` — exactly what to build first, and what NOT to build yet
