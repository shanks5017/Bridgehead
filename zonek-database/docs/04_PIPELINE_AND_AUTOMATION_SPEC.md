# Pipeline & Automation Spec

## Adapter interface (every source implements this)

```python
# adapters/base.py
from abc import ABC, abstractmethod
from datetime import datetime

class SourceAdapter(ABC):
    source_name: str  # e.g. "mca_ogd"

    @abstractmethod
    def fetch(self) -> str:
        """
        Download raw data from the source, write it unmodified to
        raw/<source_name>/<ISO-date>.<ext>, and return the file path.
        Must raise on failure — never return a partial/empty file silently.
        """

    @abstractmethod
    def to_ingest_records(self, raw_path: str) -> list[dict]:
        """
        Parse the raw file into a list of raw_entity_ingest dicts
        (see 02_DATA_SOURCE_SPECS.md output contract). No cleaning/normalization
        here beyond what's needed to split rows — that belongs to the Pipeline role.
        """
```

## End-to-end flow per source (what one GitHub Action run does)

```
1. Acquisition:  adapter.fetch()               → raw file on disk/object storage
2. Acquisition:  adapter.to_ingest_records()    → list[raw_entity_ingest]
3. Load raw:     INSERT INTO raw_ingest (...)   → one row per record, immutable
4. Normalize:    pipeline.normalize(record)     → cleaned fields
5. Resolve:      pipeline.entity_resolution()   → match/create row in companies by CIN
6. Score:        pipeline.confidence(record)    → write field_provenance rows
7. Event:        if new or changed, INSERT INTO events
8. Job log:      UPDATE ingest_jobs SET status='success', row_count=...
```

Steps 3–8 run inside a single transaction per batch where possible. If step 4, 5, or 6 fails
partway through, the job status must be marked `failed` with an error message — never leave it
silently `running` or falsely `success`.

## GitHub Actions workflow spec

One workflow file per source. Example for `mca_last30days` (daily cadence):

```yaml
# .github/workflows/ingest_mca_last30days.yml
name: Ingest MCA Last 30 Days

on:
  schedule:
    # Note: Source is a fixed monthly batch published around the 1st of each month (NOT a rolling daily feed).
    - cron: "0 4 2 * *"   # monthly on the 2nd, adjust to actual best-fetch time for the portal
  workflow_dispatch: {}    # allow manual trigger for testing

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - name: Run ingestion
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: python -m pipeline.run --source mca_last30days
      - name: Alert on failure
        if: failure()
        run: echo "Ingestion failed — wire this to a real alert (email/Slack) before Phase 1 ships"
```

Repeat the same shape for `mca_ogd` with `cron: "0 4 1 * *"` (monthly).

## Idempotency & dedup rules

- **Primary dedup key: CIN (or LLPIN for LLPs).** Never dedupe on company name alone.
- Re-running an adapter for the same date must not create duplicate `raw_ingest` rows — check
  for an existing `(source, fetched_at::date)` before inserting, or use an upsert.
- If a company already exists in `companies` and a new source disagrees with an existing field
  value, do not silently overwrite — write both to `field_provenance` (different `source`
  values, same `field_name`) and let the confidence score / most-recent-source rule decide what
  the API layer surfaces as current. Never lose the disagreement — that's the entire point of
  the provenance model.

## Definition of done for the automation layer (Phase 1)

- Both Phase 1 source workflows run on schedule without manual intervention
- A failed run is visible (GitHub Actions failure notification is enough at this stage —
  don't build a custom alerting system yet)
- Re-running a workflow manually for the same day does not duplicate data
- `ingest_jobs` table gives a complete history of every run, success or failure
