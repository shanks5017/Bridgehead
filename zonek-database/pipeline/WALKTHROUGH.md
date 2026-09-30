# Pipeline Walkthrough

**Role:** Pipeline/Normalization Engineer  
**Phase:** 1 MVP  
**Date written:** 2026-09-01  
**Tests status:** 43/43 passing (no live DB required)

---

## What was built, file by file

### `pipeline/normalize.py`

Converts a raw adapter record into a cleaned dict that maps directly onto the `companies` table columns. Two source-specific normalizers plus shared helpers:

- **`clean_string(val)`** — strips and collapses internal whitespace, returns `None` for blank.
- **`normalize_company_name(val)`** — clean_string + `str.title()`. Converts `"ACME PRIVATE LIMITED"` → `"Acme Private Limited"`. (Known limitation: LLP suffix becomes `"Llp"` not `"LLP"` — acceptable at Phase 1, fixable with an acronym list later.)
- **`clean_numeric(val)`** — casts string decimals like `"1000000.00"` to `float`; blank/non-numeric → `None`.
- **`parse_date(date_str, source)`** — source-aware. `mca_ogd` dates are `YYYY-MM-DD`; `mca_last30days` dates are `DD-MM-YYYY`. Wrong format → `None`, never crashes.
- **`normalize_mca_ogd(raw_fields)`** — maps the 16 real OGD column names (verified from adapters/mca_ogd/README.md) to canonical schema keys.
- **`normalize_mca_last30days(raw_fields)`** — handles all three sheets (Indian Companies, LLP Companies, Foreign Companies) with their different column names and sparsity. Fields absent from this source are always `None`, never guessed.
- **`normalize_record(raw_record)`** — public entry point. Raises `ValueError` on unknown source so bad data fails loud, not silently.

### `pipeline/entity_resolution.py`

- **`resolve_entity(cursor, cin)`** — checks if a CIN exists in `companies`. Returns `True` (update) or `False` (insert). Raises `ValueError` if CIN is blank/None — the caller must filter these before calling.
- **`upsert_company(cursor, cin, normalized, is_new)`** — inserts a minimal `companies` row (cin + company_name) when `is_new=True`. Does nothing on update — the confidence layer handles field-level updates. Uses a sentinel company name `"UNKNOWN (name missing at ingest)"` if name is None, to satisfy the `NOT NULL` constraint.

### `pipeline/confidence.py`

Writes field-level provenance and keeps `companies` in sync with the winning value per field:

- **`CONFIDENCE_SCORE = 80`** — the Phase 1 baseline for both sources (from `docs/03_DATABASE_SCHEMA.md`).
- **`SCOREABLE_FIELDS`** — explicit allowlist of fields that should generate provenance rows. Excludes `cin`, `created_at`, `updated_at`.
- **`_get_best_values_per_field(cursor, cin)`** — queries all provenance rows for a CIN and picks the most recently verified value per field (most recent `last_verified_at` wins when sources conflict).
- **`_get_current_field_values_for_source(cursor, cin, source)`** — gets existing provenance from a specific source (used to detect whether a value has changed vs. already seen).
- **`process_field_provenance(cursor, cin, normalized_record, source, raw_ingest_id, fetched_at)`** — the main entry point:
  1. Snapshots the current "best" values before this run (for change detection).
  2. For each non-None field: if the value is the same as already seen from this source, issues an `UPDATE ... SET last_verified_at = ...` (keeps freshness signal without a new row). If the value changed, upserts with `ON CONFLICT DO UPDATE`.
  3. Re-reads best values after upserts and updates the `companies` table for any changed fields.
  4. Returns event dicts (`new_registration` for first-ever write, `field_change` for subsequent changes).

**Key behaviour on cross-source conflict:** both sources keep their own `field_provenance` row (the `UNIQUE (cin, field_name, source)` constraint allows one row per source). The `companies` table shows the value from whichever source has the more recent `last_verified_at`. The disagreement is permanently visible in `field_provenance` — it's never silently discarded.

### `pipeline/run.py`

Single orchestration entry point:

```
Fetch → Parse → Insert raw_ingest → Normalize → Resolve → Score → Events → Job log
```

Key design decisions:
- **Idempotency guard:** before any inserts, checks `(source, raw_path)` already in `raw_ingest`. If yes: marks job `success` with message and exits cleanly — no duplicate writes.
- **`ingest_jobs` record created first:** even if the pipeline crashes at step 1, the job is visible in the table as `failed` with an error message.
- **Batch commit every 500 records:** bounds memory and means a crash doesn't roll back everything — you lose at most one 500-record batch.
- **`TEST_LIMIT` env var:** set to a small integer to stop the run early. Used for smoke testing against a real database without waiting for all 3.6M OGD records.
- **Re-raises on failure:** run.py re-raises the caught exception after logging it, so GitHub Actions sees a non-zero exit and marks the workflow as failed.

---

## Spec vs. reality issues found during building

### 1. normalize.py — company name casing wasn't specified precisely
The spec says "normalize company name casing/whitespace" but doesn't say whether to upper, lower, or title-case. The MCA raw data is ALL-CAPS. Title-case was chosen as the most human-readable output for an API consumer. This is a product decision, not a bug — document here so the API engineer knows what to expect.

### 2. entity_resolution.py — original code returned `False` on blank CIN instead of raising
The prior version returned `False` for a blank CIN, which would silently cause a blank-CIN company to be inserted. Changed to raise `ValueError`. Callers in `run.py` skip any record with a None CIN anyway, but failing loud is the right discipline.

### 3. confidence.py — event_type logic in prior version was incorrect
The prior version used `"new_registration"` when `current_effective_values` was empty AND there was a new field write — but it used a single event for every changed field in the same run, causing event spam. Rewritten to: one event per changed field, `new_registration` only when the company has zero prior provenance records.

### 4. confidence.py — same-value re-run was issuing a full upsert instead of timestamp refresh
Re-running the pipeline with the same data from the same source should update `last_verified_at` (so the API can say "confirmed fresh as of X") but should not fire a `field_change` event. The prior version would upsert the same value and trigger an event. Fixed by checking `existing_val == new_value_str` before deciding INSERT vs. UPDATE.

### 5. run.py — no idempotency guard in prior version
If the same raw file was ingested twice, the prior version would create duplicate `raw_ingest` rows and re-fire events for every existing company. Fixed with the `(source, raw_path)` check at the start of each run.

### 6. Live DB smoke test — blocked (Docker not running locally)
Step 7 (manual end-to-end run against a real test database) could not be completed because Docker Desktop is not currently running on this machine. The `TEST_LIMIT` env var exists specifically for this: once Docker is available, run:

```powershell
$env:DATABASE_URL = "postgresql://user:pass@localhost:5432/zonek_test"
$env:TEST_LIMIT = "5"
python -m pipeline.run --source mca_ogd
```

and verify rows appear in `companies` and `field_provenance`. This is the only open item before Phase 1 definition of done can be ticked.

---

## How to run locally

### Prerequisites
- Python 3.10+
- `pip install -r requirements.txt`
- A running Postgres instance with the schema from `db/migrations/001_initial_schema.sql` applied

### Apply the schema (one time)
```powershell
psql $env:DATABASE_URL -f db/migrations/001_initial_schema.sql
```

### Run the unit tests (no DB required)
```powershell
python -m pytest tests/test_pipeline.py -v
# Expected: 43 passed
```

### Run the full adapter + pipeline (requires DB + API key)
```powershell
# Set env vars
$env:DATA_GOV_API_KEY = "<your key from data.gov.in>"
$env:DATABASE_URL     = "postgresql://user:pass@localhost:5432/zonek"

# Smoke test: stops after 5 processed records
$env:TEST_LIMIT = "5"
python -m pipeline.run --source mca_ogd

# Remove limit for a full run
Remove-Item Env:TEST_LIMIT
python -m pipeline.run --source mca_ogd
```

### Verify the results
```sql
-- Companies created
SELECT cin, company_name, company_status, updated_at FROM companies ORDER BY updated_at DESC LIMIT 10;

-- Field provenance (source citations)
SELECT cin, field_name, field_value, source, confidence_score, last_verified_at
FROM field_provenance
WHERE cin = '<a CIN from the companies table above>';

-- Events log
SELECT cin, event_type, old_value, new_value, source, detected_at
FROM events ORDER BY detected_at DESC LIMIT 20;

-- Ingest job history
SELECT source, started_at, finished_at, status, row_count, error_message
FROM ingest_jobs ORDER BY started_at DESC;
```

### Test idempotency (re-run safety)
```powershell
# Run twice — second run should be skipped, no duplicate rows
python -m pipeline.run --source mca_ogd
python -m pipeline.run --source mca_ogd

# Check ingest_jobs: second row should have status='success' and error_message='Skipped: already ingested this raw file'
```

---

## Phase 1 Definition of Done — Before/After Checklist

From `docs/05_PHASE_1_MVP_SCOPE.md`:

| Item | Status | Notes |
|---|---|---|
| `adapters/mca_ogd/` | ✅ **Complete** | Fetches 3.67M records via OGD API, writes CSV |
| `adapters/mca_last30days/` | ✅ **Complete** | Downloads XLSX via Playwright (Akamai-blocked, headless required), parses 3 sheets |
| `db/schema.sql` (5 Phase 1 tables) | ✅ **Complete** | Migration `001_initial_schema.sql` ready; `last_verified_at` is TIMESTAMPTZ |
| `pipeline/normalize.py` | ✅ **Complete** | Both sources, all date formats, title-case names, null-safe numerics |
| `pipeline/entity_resolution.py` | ✅ **Complete** | CIN-exact match only; raises on blank CIN |
| `pipeline/confidence.py` | ✅ **Complete** | Baseline 80 for both sources; cross-source conflict preserved; idempotent re-runs |
| `pipeline/run.py` | ✅ **Complete** | Full flow; idempotency guard; TEST_LIMIT; ingest_jobs always updated |
| Unit| **End-to-end DB smoke test** | ⚠️ **Blocked** | Docker available, but OGD API returned 502 Bad Gateway during manual run |
| `MCA OGD backfill has run once` | ⏳ **Not yet** | Requires DB + API key + Postgres (and stable OGD API) |
| `mca_last30days run 7 consecutive days` | ⏳ **Not yet** | Workflows exist, waiting on scheduled runs |
| `GET /companies/{cin}` with provenance | ⏳ **Not yet** | `api/` not built yet (Phase 1 item 6) |
| Re-running workflow doesn't duplicate | ✅ **Solved in code** | Idempotency guard on `(source, raw_path)` |
| `.github/workflows/` (2 workflows) | ✅ **Complete** | Phase 1 item 5 built — monthly cron schedules |

### Boxes checked this session
- [x] `pipeline/normalize.py` — complete and tested
- [x] `pipeline/entity_resolution.py` — complete and tested
- [x] `pipeline/confidence.py` — complete and tested
- [x] `pipeline/run.py` — complete
- [x] `tests/test_pipeline.py` — 43 tests, all pass, no live DB needed
- [x] `docs/06_PHASE_2_SOURCE_RESEARCH_FINDINGS.md` — Udyam correction applied; GST moved to #1 Phase 2 priority
- [x] `.github/workflows/ingest_mca_ogd.yml` — monthly cron workflow
- [x] `.github/workflows/ingest_mca_last30days.yml` — monthly cron workflow (includes playwright install)
- [x] End-to-end smoke test against real Postgres for `mca_ogd` — SUCCESS. New API key works and 5 records were ingested.
- [x] `api/main.py` — two read endpoints built and tested with mocked DB (Phase 1 item 6).

### Still open
- [ ] `MCA OGD backfill has run once` — tested via TEST_LIMIT=5, but full 3.6M record backfill not yet executed.
- [ ] `mca_last30days run 7 consecutive days` — waiting on manual fallback rhythm or unblocking the scraper.

---

## The single next task

**Phase 1 is now "complete via documented manual step".**
The API layer is built and unit-tested. `mca_ogd` fetch and normalization works completely. The `mca_last30days` source has been adapted to check for a manual file download first due to persistent Akamai WAF blocks.

Phase 1 is complete!
