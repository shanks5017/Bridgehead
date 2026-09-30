# adapters/mca_last30days/fetch.py
#
# Role: Data Acquisition Engineer
# Owned file: adapters/mca_last30days/fetch.py
#
# Downloads the MCA "Incorporated Or Closed During The Month" XLSX from:
#   https://www.mca.gov.in/content/mca/global/en/data-and-reports/
#           company-llp-info/incorporated-closed-month.html
#
# Source reality notes: see adapters/mca_last30days/README.md
#
# KEY FINDING: mca.gov.in is protected by Akamai WAF — plain HTTP requests
# (requests, curl, Invoke-WebRequest) all receive 403 Access Denied regardless
# of User-Agent spoofing. A headless browser (Playwright) is required.
# This is NOT an optional fallback; it is the only viable access method.
#
# Spec: docs/02_DATA_SOURCE_SPECS.md, docs/04_PIPELINE_AND_AUTOMATION_SPEC.md

import json
import logging
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from adapters.base import SourceAdapter
from adapters.mca_last30days.parse import to_ingest_records as _parse

logger = logging.getLogger(__name__)

# Import Playwright at module level so tests can patch it.
# Using a try/except so the module still imports cleanly when Playwright is absent;
# the actual RuntimeError with install instructions is raised inside fetch().
try:
    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth
except ImportError:  # pragma: no cover
    sync_playwright = None  # type: ignore[assignment]
    Stealth = None

# ── Constants ────────────────────────────────────────────────────────────────

LISTING_URL = (
    "https://www.mca.gov.in/content/mca/global/en/data-and-reports/"
    "company-llp-info/incorporated-closed-month.html"
)

# CSS selector for the download link of the most recent (first / "New"-tagged) file.
# The page lists files newest-first; the first download icon is what we want.
# Selector targets the first download anchor in the "Master Details of Companies Registered" table.
FIRST_DOWNLOAD_SELECTOR = (
    "section.mca-table-section table tbody tr:first-child td.text-center a"
)

# Fallback: any anchor whose href contains the file extension
FALLBACK_DOWNLOAD_SELECTOR = "table tbody tr:first-child a[href]"

# Page load / download wait timeouts (ms)
PAGE_TIMEOUT_MS = 60_000
DOWNLOAD_TIMEOUT_MS = 120_000


# ── Adapter ──────────────────────────────────────────────────────────────────

class MCALast30DaysAdapter(SourceAdapter):
    """
    Adapter for the MCA "Incorporated Or Closed During The Month" monthly XLSX.

    Access method: Playwright headless Chromium.
    Plain scripted HTTP (requests/curl) is blocked by Akamai WAF — see README.

    Data granularity: MONTHLY batches, not rolling 30 days.
    File naming: raw/mca_last30days/<YYYY-MM>.xlsx  (year-month granularity)
    Idempotency: if this month's file already exists, skip the download.

    Usage:
        from adapters.mca_last30days import MCALast30DaysAdapter

        adapter = MCALast30DaysAdapter()
        raw_path = adapter.fetch()
        records  = adapter.to_ingest_records(raw_path)

    Dependencies:
        pip install playwright openpyxl
        playwright install chromium
    """

    source_name = "mca_last30days"

    def __init__(self, raw_root: str = "raw") -> None:
        """
        Parameters
        ----------
        raw_root:
            Root directory for raw snapshots. Defaults to "raw/" relative to CWD.
        """
        self.raw_root = Path(raw_root)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _current_month_str(self) -> str:
        """Return current year-month as 'YYYY-MM' (file naming granularity)."""
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def _out_path(self) -> Path:
        """Return the expected output path for this month's file."""
        out_dir = self.raw_root / self.source_name
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir / f"{self._current_month_str()}.xlsx"
        
    def _manual_path(self) -> Path:
        """Return the expected path for a manually downloaded fallback file."""
        return self.raw_root / self.source_name / "manual" / f"{self._current_month_str()}.xlsx"

    def _download_with_playwright(self, out_path: Path) -> None:
        """
        Open the MCA listing page in headless Chromium, locate the most-recent
        month's download link, click it, and save the resulting XLSX to out_path.

        Raises RuntimeError if Playwright is not installed, the page can't be loaded,
        or no download is triggered within DOWNLOAD_TIMEOUT_MS.
        """
        if sync_playwright is None:
            raise RuntimeError(
                "Playwright is required for the mca_last30days adapter but is not installed. "
                "Run: pip install playwright && playwright install chromium"
            )

        try:
            from playwright.sync_api import TimeoutError as PlaywrightTimeout
        except ImportError as exc:
            raise RuntimeError(
                "Playwright is required but not installed. "
                "Run: pip install playwright && playwright install chromium"
            ) from exc

        logger.info("Launching headless Chromium to download from MCA portal…")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            context = browser.new_context(
                accept_downloads=True,
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/128.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
            
            # Apply stealth
            if Stealth:
                Stealth().apply_stealth_sync(page)

            try:
                logger.info("Loading MCA listing page: %s", LISTING_URL)
                page.goto(LISTING_URL, timeout=PAGE_TIMEOUT_MS, wait_until="networkidle")
            except PlaywrightTimeout as exc:
                raise RuntimeError(
                    f"Timed out loading MCA listing page ({PAGE_TIMEOUT_MS}ms). "
                    f"Check network connectivity or whether the portal URL has changed."
                ) from exc

            page_title = page.title()
            logger.info("Page loaded: %s", page_title)

            # Locate the first download link — try primary selector, fall back
            try:
                link = page.locator(FIRST_DOWNLOAD_SELECTOR).first
                link.wait_for(timeout=10_000)
            except Exception:
                logger.warning(
                    "Primary selector not matched; trying fallback selector for download link"
                )
                try:
                    link = page.locator(FALLBACK_DOWNLOAD_SELECTOR).first
                    link.wait_for(timeout=10_000)
                except Exception as exc:
                    # Last resort: find any download icon link
                    raise RuntimeError(
                        "Could not locate a download link on the MCA listing page. "
                        "The page structure may have changed — update FIRST_DOWNLOAD_SELECTOR "
                        "in adapters/mca_last30days/fetch.py. "
                        f"Page title was: {page_title!r}"
                    ) from exc

            logger.info("Found download link. Clicking and waiting for download…")
            with page.expect_download(timeout=DOWNLOAD_TIMEOUT_MS) as download_info:
                link.click()
            download = download_info.value

            if download.failure():
                raise RuntimeError(
                    f"Download failed: {download.failure()}. "
                    f"Suggested filename was: {download.suggested_filename!r}"
                )

            suggested = download.suggested_filename
            logger.info("Download complete: %s", suggested)

            # Validate it's an XLSX before saving
            if not suggested.lower().endswith((".xlsx", ".xls")):
                raise RuntimeError(
                    f"Expected an XLSX file but got: {suggested!r}. "
                    f"The MCA portal may have changed its export format."
                )

            # Save to temp, then atomic rename
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
                tmp_path = Path(tmp.name)
            try:
                download.save_as(tmp_path)
                shutil.move(str(tmp_path), str(out_path))
            except Exception:
                tmp_path.unlink(missing_ok=True)
                raise

            browser.close()

    # ── Public interface (SourceAdapter) ─────────────────────────────────────

    def fetch(self) -> str:
        """
        Download the most recent monthly XLSX from the MCA incorporation report page.
        Saves to raw/mca_last30days/<YYYY-MM>.xlsx and writes a manifest JSON.

        Returns
        -------
        str
            Absolute path to the raw XLSX file.

        Raises
        ------
        RuntimeError
            On page load failure, missing download link, download failure,
            or wrong file format. Never silently returns a partial file.
        """
        out_path = self._out_path()
        month_str = self._current_month_str()

        # Idempotency: skip if this month's file already exists
        if out_path.exists():
            logger.info(
                "Raw file for %s already exists at %s — skipping fetch (idempotent run).",
                month_str, out_path,
            )
            return str(out_path)

        fetched_at = datetime.now(timezone.utc).isoformat()

        # Check for manual fallback first
        manual_path = self._manual_path()
        if manual_path.exists():
            logger.info("Found manual fallback file at %s. Skipping automated Playwright fetch.", manual_path)
            shutil.copy2(str(manual_path), str(out_path))
        else:
            self._download_with_playwright(out_path)

        if not out_path.exists() or out_path.stat().st_size == 0:
            raise RuntimeError(
                f"Download appeared to succeed but output file is missing or empty: {out_path}"
            )

        # Parse to get row count for manifest (all sheets combined)
        try:
            records = _parse(str(out_path))
            row_count = len(records)
        except Exception as exc:
            logger.warning("Could not parse file for row count: %s", exc)
            row_count = -1

        # Write manifest (role output contract)
        manifest = {
            "source": self.source_name,
            "fetched_at": fetched_at,
            "raw_path": str(out_path),
            "row_count": row_count,
            "status": "success",
        }
        manifest_path = out_path.parent / f"{month_str}.manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        logger.info("Wrote %d records → %s (manifest: %s)", row_count, out_path, manifest_path)

        return str(out_path)

    def to_ingest_records(self, raw_path: str) -> list[dict]:
        """
        Parse the raw XLSX at raw_path into raw_entity_ingest records.
        Delegates to adapters/mca_last30days/parse.py.
        """
        return _parse(raw_path)
