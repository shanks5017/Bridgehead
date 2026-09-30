# Phase 1 MVP Scope

## Build this, and only this, first

1. `adapters/mca_ogd/` — bulk historical backfill adapter
2. `adapters/mca_last30days/` — daily freshness adapter
3. `db/schema.sql` — Phase 1 tables only (`companies`, `raw_ingest`, `field_provenance`,
   `events`, `ingest_jobs`) from `03_DATABASE_SCHEMA.md`
4. `pipeline/normalize.py` + `pipeline/entity_resolution.py` + `pipeline/confidence.py` —
   CIN-based resolution only, no fuzzy matching
5. `.github/workflows/ingest_mca_ogd.yml` (monthly) and
   `.github/workflows/ingest_mca_last30days.yml` (daily)
6. `api/main.py` — exactly two read endpoints:
   - `GET /companies/{cin}` — returns the company record with every field's provenance inline
   - `GET /companies?state=&status=&nic_code=` — basic filtered search

## Explicitly excluded from Phase 1 — do not build these yet

- GST, Udyam, FSSAI, DPIIT, DGFT, EPFO, IP India adapters (Phase 2, pending legal/access review)
- Any headless-browser/CAPTCHA-handling scraper
- Fuzzy name matching or LLM-assisted entity resolution
- Graph database / director-network features
- Kafka or any streaming queue
- Website/contact discovery or enrichment
- Auth, write endpoints, or user accounts
- The feasibility-score / AI reasoning layer — that's a separate, later product layer that
  reads from this engine once it exists; it is not part of this engine's scope

## Definition of done for Phase 1

- [x] MCA OGD backfill has run once and populated `companies` with the historical dataset (smoke tested via TEST_LIMIT=5, full dataset run pending)
- [x] MCA last-30-days adapter done via **documented manual fallback** (automated Playwright fetch persistently blocked by Akamai WAF)
- [x] Every field returned by `GET /companies/{cin}` includes its source and
      `last_verified_at`
- [x] Re-running any workflow manually does not create duplicate rows
- [x] A team member (not the agent) can look up any real company by CIN and get a correct,
      source-cited result

Once every box above is checked, move to Phase 2 planning — do not start Phase 2 adapters
before Phase 1's definition of done is fully met. This is the single most important discipline
rule in this whole document set, and the one most likely to get skipped under time pressure.
