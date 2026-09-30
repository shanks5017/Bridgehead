# WALKTHROUGH: mca_last30days Adapter

**Audience:** Project owner (non-engineer)  
**Written by:** Data Acquisition Engineer role  
**Date:** 2026-08-30  
**Status:** Complete — 40/40 tests passing across both adapters

---

## What was built (file by file)

### `adapters/mca_last30days/README.md`
The first thing written — before any code. Documents what the live source actually
looks like, the access method, column names, and every place reality differs from
the spec. Read this before touching anything else in this adapter.

### `adapters/mca_last30days/fetch.py`
The download engine. When you call `adapter.fetch()` it:
1. Opens the MCA portal page in a hidden (headless) Chromium browser
2. Clicks the download link for the most recent month's file
3. Saves the XLSX to `raw/mca_last30days/YYYY-MM.xlsx`
4. Writes a small JSON manifest alongside it (source, date fetched, row count)
5. If this month's file already exists, skips all of the above (safe to run multiple times)

The headless browser is necessary because the MCA website uses Akamai WAF security
software that blocks all automated HTTP tools (curl, Python requests, PowerShell).
Only a real browser (or a headless browser that perfectly mimics one) gets through.

### `adapters/mca_last30days/parse.py`
The reader. Given a path to an XLSX file, it:
1. Opens all three sheets (Indian Companies, LLP Companies, Foreign Companies)
2. Skips the title row and blank rows at the top of each sheet
3. Reads every data row verbatim — no modification, no interpretation
4. Returns a list of records in the standard shape that the downstream pipeline expects

Each record looks like:
`json
{
  "source": "mca_last30days",
  "source_record_id": "U68100UW2026PTC255121",
  "fetched_at": "2026-08-01T00:30:04+00:00",
  "raw_fields": {
    "CIN": "U68100UW2026PTC255121",
    "Class": "Private",
    "Company Name": "1 BEEGHA PRIVATE LIMITED",
    "Date Of Registration": "01-07-2026",
    "Company Type": "Non-government company",
    "Activity Code": "68",
    "_sheet": "Indian Companies"
  }
}
`

### `tests/test_mca_last30days.py`
22 automated tests. None of them hit the real MCA website. They use:
- A mock headless browser (for fetch tests) — so the download is simulated
- A real XLSX file built from actual rows scraped from the July 2026 download (for parse tests)

### `adapters/mca_last30days/__init__.py`
Housekeeping file — makes Python treat the folder as a package.

---

## Live source vs spec — what the spec got wrong

| # | What the spec assumed | What is actually true |
|---|---|---|
| **1 ⚠️** | Source is at "MCA Services → Master Data Services" | It's at **Data & Reports → Company/LLP Information → Incorporated Or Closed During The Month** |
| **2 ⚠️** | Data covers "last 30 days" (rolling window) | Data is **fixed monthly batches**. July file = all July registrations, published 01-Aug. There is no 30-day rolling window. |
| **3 ⚠️** | Scripted HTTP request should work first | MCA uses **Akamai WAF** — every scripted request (curl/requests/PowerShell) gets "Access Denied". A headless browser is not optional; it is the only viable method. |
| **4** | Single entity type per file | **Three sheets** per file: Indian Companies, LLP Companies, Foreign Companies — each with a different column structure. |
| **5** | Same fields as mca_ogd | Far fewer fields. Only: ID, Class/Type, Name, Registration Date, Activity Code. No address, no capital amounts, no ROC code, no listing status. |
| **6** | Date format same as mca_ogd | mca_ogd uses `YYYY-MM-DD`; this source uses `DD-MM-YYYY`. Pipeline must handle both. |

---

## How the two adapters relate to each other

Both adapters feed data into the same downstream pipeline, but they serve different purposes:

| | mca_ogd | mca_last30days |
|---|---|---|
| **What it is** | Full historical dump (3.6M companies, all states) | Monthly batch of newly registered entities |
| **Freshness** | Bulk snapshot, last updated 22-Jul-2026 | Most recent = companies registered last calendar month |
| **Cadence** | Monthly re-fetch (check for updates) | Monthly fetch (new file published ~1st of each month) |
| **Access** | data.gov.in JSON API (API key needed) | MCA portal XLSX (headless browser needed) |
| **Primary key** | CIN (same column name) | CIN (Indian) / LLPIN (LLP) / FCIN (Foreign) — same values, different column names by sheet |
| **Role** | Historical backfill — populate the full company database | Freshness signal — catch new registrations each month |
| **Column count** | 16 columns | 6 columns (Indian), 4 columns (LLP/Foreign) |

The Pipeline role (built next) will use CIN/LLPIN to match records from both sources
to the same company row in the database. When both sources have data for the same company,
the field_provenance table records both, and mca_last30days gets a slightly higher
confidence score (90 vs 75) because it is more recently published.

---

## How to test this adapter locally

### Run the automated test suite (no internet needed)
`
cd "d:\my projects\zonek-database"
python -m pytest tests/ -v
`
Expected: **40 passed** in ~30 seconds.

### Run a real fetch (downloads from MCA portal — needs Playwright installed)

**Step 1: Install Playwright (one-time setup)**
`
pip install playwright
playwright install chromium
`

**Step 2: Run a real fetch**
`python
from adapters.mca_last30days import MCALast30DaysAdapter
import logging
logging.basicConfig(level=logging.INFO)

adapter = MCALast30DaysAdapter(raw_root="raw")
raw_path = adapter.fetch()
print(f"Downloaded to: {raw_path}")
`

**Step 3: Parse the downloaded file**
`python
records = adapter.to_ingest_records(raw_path)
print(f"Total records: {len(records)}")
print("First record:", records[0])
`

### Parse the sample file you already have (offline)
`python
from adapters.mca_last30days.parse import to_ingest_records

records = to_ingest_records(r"d:\my projects\zonek-database\Incorporation-Report-20260802 (1).xlsx")
print(f"Total records: {len(records)}")
indian = [r for r in records if r['raw_fields']['_sheet'] == 'Indian Companies']
llp    = [r for r in records if r['raw_fields']['_sheet'] == 'LLP Companies']
foreign = [r for r in records if r['raw_fields']['_sheet'] == 'Foreign Companies']
print(f"Indian: {len(indian)}, LLP: {len(llp)}, Foreign: {len(foreign)}")
`
Expected output: Indian: 26225, LLP: 11819, Foreign: 11

---

## Phase 1 definition-of-done checklist (from 05_PHASE_1_MVP_SCOPE.md)

### ✅ Completed by this task + previous task
- [x] `adapters/mca_ogd/` — built, 18 tests passing
- [x] `adapters/mca_last30days/` — built, 22 tests passing (40 total across both)

### ❌ Still outstanding before Phase 1 is complete

| Item | What it requires |
|---|---|
| `db/schema.sql` | Data Modeling Engineer creates the 5 Postgres tables |
| `pipeline/normalize.py` + `entity_resolution.py` + `confidence.py` | Pipeline Engineer reads raw_ingest records, normalizes fields, matches by CIN |
| `.github/workflows/ingest_mca_ogd.yml` | Platform Engineer schedules monthly workflow |
| `.github/workflows/ingest_mca_last30days.yml` | Platform Engineer schedules monthly workflow (note: NOT daily — cadence is monthly, not 30-day rolling) |
| `api/main.py` | API Engineer builds two read endpoints: `GET /companies/{cin}` and `GET /companies?state=&status=&nic_code=` |
| MCA OGD backfill has actually run once | Requires db + pipeline to exist first |
| 7 consecutive successful workflow runs | Requires GitHub Actions + pipeline to exist |
| A team member can look up a real company by CIN | Requires all of the above |

Phase 1 is **0% of the way to "done"** on the definition-of-done checklist — the two adapters are the foundation but nothing runs end-to-end yet.

---

## The single next task (per 05_PHASE_1_MVP_SCOPE.md)

**Item 3: `db/schema.sql`** — Data Modeling Engineer role.

Create the five Phase 1 tables exactly as specified in `03_DATABASE_SCHEMA.md`:
`companies`, `raw_ingest`, `field_provenance`, `events`, `ingest_jobs`.

One important note for the Data Modeling Engineer based on adapter findings:
the `raw_ingest` table will store records from both adapters. The `raw_fields` JSONB
column will contain 16 fields for mca_ogd rows and 6-7 fields for mca_last30days rows
(including `_sheet`). This is fine — the schema is already designed for this via JSONB.
No schema change needed. Build it exactly as documented.
