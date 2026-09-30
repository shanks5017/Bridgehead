# adapters/mca_ogd/fetch.py
#
# Role: Data Acquisition Engineer
# Owned file: adapters/mca_ogd/fetch.py
#
# Downloads the MCA "Registrars of Companies (RoC)-wise Company Master Data"
# from the data.gov.in OGD API and saves it as a single CSV to:
#   raw/mca_ogd/<ISO-date>.csv
#
# Source reality notes: see adapters/mca_ogd/README.md
# Spec: docs/02_DATA_SOURCE_SPECS.md, docs/04_PIPELINE_AND_AUTOMATION_SPEC.md

import csv
import io
import json
import logging
import os
import time
from datetime import date, datetime, timezone
from pathlib import Path

import requests

from adapters.base import SourceAdapter
from adapters.mca_ogd.parse import to_ingest_records as _parse

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

RESOURCE_UUID = "4dbe5667-7b6b-41d7-82af-211562424d9a"
API_BASE = f"https://api.data.gov.in/resource/{RESOURCE_UUID}"

# Maximum records per API request (data.gov.in OAS 2.0 hard cap is 10,000)
PAGE_SIZE = 10_000

# Retry config for transient network / API errors
MAX_RETRIES = 3
RETRY_BACKOFF_S = 10  # seconds; multiplied by attempt number

# The 16 column names as confirmed against the live API on 2026-08-30.
# Used only for schema-drift detection — the adapter does NOT rely on this list
# to filter or reorder columns; it writes whatever the API returns verbatim.
EXPECTED_COLUMNS: frozenset[str] = frozenset({
    "CIN",
    "CompanyName",
    "CompanyROCcode",
    "CompanyCategory",
    "CompanySubCategory",
    "CompanyClass",
    "AuthorizedCapital",
    "PaidupCapital",
    "CompanyRegistrationdate_date",
    "Registered_Office_Address",
    "Listingstatus",
    "CompanyStatus",
    "CompanyStateCode",
    "CompanyIndian/Foreign Company",
    "nic_code",
    "CompanyIndustrialClassification",
})


# ── Adapter ──────────────────────────────────────────────────────────────────

class MCAOGDAdapter(SourceAdapter):
    """
    Adapter for the MCA Company Master Data (OGD bulk resource).

    Usage:
        import os
        from adapters.mca_ogd import MCAOGDAdapter

        adapter = MCAOGDAdapter(api_key=os.environ["DATA_GOV_API_KEY"])
        raw_path = adapter.fetch()
        records  = adapter.to_ingest_records(raw_path)

    Environment variables:
        DATA_GOV_API_KEY  — required; obtain from data.gov.in
    """

    source_name = "mca_ogd"

    def __init__(self, api_key: str | None = None, raw_root: str = "raw") -> None:
        """
        Parameters
        ----------
        api_key:
            data.gov.in API key. Defaults to the DATA_GOV_API_KEY env var.
            Raises ValueError immediately if neither is provided — fail fast.
        raw_root:
            Root directory for raw snapshots. Defaults to "raw/" relative to CWD.
        """
        key = api_key or os.environ.get("DATA_GOV_API_KEY", "").strip()
        if not key:
            raise ValueError(
                "data.gov.in API key is required. "
                "Pass api_key= or set the DATA_GOV_API_KEY environment variable. "
                "See adapters/mca_ogd/README.md — the spec incorrectly states no auth "
                "is needed; the live API endpoint requires a key."
            )
        self._api_key = key
        self.raw_root = Path(raw_root)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _get_page(self, offset: int, limit: int) -> dict:
        """
        Fetch one page of JSON records from the data.gov.in API.
        Retries up to MAX_RETRIES times on transient errors.
        Raises RuntimeError on permanent API-level errors.
        """
        params: dict = {
            "api-key": self._api_key,
            "format": "json",
            "offset": offset,
            "limit": limit,
        }
        headers: dict = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        last_exc: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.get(API_BASE, params=params, headers=headers, timeout=90)
                resp.raise_for_status()
                data: dict = resp.json()
                if data.get("status") == "error":
                    raise RuntimeError(
                        f"data.gov.in API returned an error response: "
                        f"{data.get('message', '(no message)')} "
                        f"— check your API key and the resource UUID."
                    )
                return data
            except (requests.RequestException, RuntimeError) as exc:
                last_exc = exc
                if attempt == MAX_RETRIES:
                    break
                wait = RETRY_BACKOFF_S * attempt
                logger.warning(
                    "Attempt %d/%d failed at offset=%d (%s). Retrying in %ds…",
                    attempt, MAX_RETRIES, offset, exc, wait,
                )
                time.sleep(wait)
        raise RuntimeError(
            f"Failed to fetch offset={offset} after {MAX_RETRIES} attempts."
        ) from last_exc

    def _detect_schema_drift(self, fieldnames: list[str]) -> None:
        """Log warnings if the API's column set has changed since last verification."""
        live = set(fieldnames)
        missing = EXPECTED_COLUMNS - live
        extra = live - EXPECTED_COLUMNS
        if missing:
            logger.warning(
                "SCHEMA DRIFT — columns expected but absent from API response: %s. "
                "Downstream pipeline may break. Update EXPECTED_COLUMNS and README.",
                sorted(missing),
            )
        if extra:
            logger.info(
                "API returned extra columns not in spec (will be preserved in raw_fields): %s",
                sorted(extra),
            )

    # ── Public interface (SourceAdapter) ─────────────────────────────────────

    def fetch(self) -> str:
        """
        Page through the data.gov.in API and write all records as a single
        UTF-8 CSV to raw/mca_ogd/<ISO-date>.csv.

        Returns
        -------
        str
            Absolute path to the raw CSV file.

        Raises
        ------
        RuntimeError
            On any API error, empty response, or write failure.
            Never returns a path to a partial or empty file.
        """
        today = date.today().isoformat()
        out_dir = self.raw_root / self.source_name
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{today}.csv"

        # Idempotency: skip if today's file already exists
        if out_path.exists():
            logger.info(
                "Raw file for %s already exists at %s — skipping fetch (idempotent run).",
                today, out_path,
            )
            return str(out_path)

        fetched_at = datetime.now(timezone.utc).isoformat()

        # ── Step 1: probe total record count ──────────────────────────────────
        logger.info("Probing total record count from data.gov.in API…")
        probe = self._get_page(offset=0, limit=1)
        total = int(probe.get("total", 0))
        if total == 0:
            raise RuntimeError(
                "API reported total=0 records — aborting to avoid writing an empty file. "
                "Check API key validity and resource availability."
            )
        logger.info("API reports %d total records. Beginning paginated fetch…", total)

        # ── Step 2: paginate through all records ──────────────────────────────
        all_records: list[dict] = []
        offset = 0
        test_limit = os.environ.get("TEST_LIMIT")
        
        while offset < total:
            logger.info("Fetching records %d–%d of %d…", offset + 1, min(offset + PAGE_SIZE, total), total)
            page = self._get_page(offset=offset, limit=PAGE_SIZE)
            batch: list[dict] = page.get("records", [])
            if not batch:
                logger.warning(
                    "Received empty batch at offset=%d (expected more records up to %d). "
                    "Stopping pagination early.",
                    offset, total,
                )
                break
            all_records.extend(batch)
            offset += len(batch)
            
            if test_limit:
                logger.info("TEST_LIMIT is set, stopping after first page.")
                break

        if not all_records:
            raise RuntimeError(
                "Pagination completed but 0 records were accumulated — "
                "refusing to write an empty file."
            )

        # ── Step 3: schema drift check ────────────────────────────────────────
        fieldnames = list(all_records[0].keys())
        self._detect_schema_drift(fieldnames)

        # ── Step 4: write CSV atomically (temp → rename) ──────────────────────
        tmp_path = out_path.with_suffix(".tmp")
        try:
            with tmp_path.open("w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(all_records)
            tmp_path.rename(out_path)
        except Exception:
            tmp_path.unlink(missing_ok=True)  # clean up partial file
            raise

        row_count = len(all_records)
        logger.info("Wrote %d rows → %s", row_count, out_path)

        # ── Step 5: write manifest (role output contract) ─────────────────────
        manifest = {
            "source": self.source_name,
            "fetched_at": fetched_at,
            "raw_path": str(out_path),
            "row_count": row_count,
            "status": "success",
        }
        manifest_path = out_dir / f"{today}.manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        logger.info("Manifest → %s", manifest_path)

        return str(out_path)

    def to_ingest_records(self, raw_path: str) -> list[dict]:
        """
        Parse the raw CSV at raw_path into a list of raw_entity_ingest dicts.
        Delegates to adapters/mca_ogd/parse.py.
        """
        return _parse(raw_path)
