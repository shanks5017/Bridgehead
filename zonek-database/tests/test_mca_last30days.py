# tests/test_mca_last30days.py
#
# Tests for the mca_last30days adapter (fetch.py + parse.py).
#
# Design:
#   - fetch() is tested with a fully mocked Playwright context — never hits the real portal.
#   - to_ingest_records() / parse.py is tested against a real in-memory XLSX fixture
#     built from actual sample rows captured from the live July 2026 file.
#   - The real MCA portal is NOT contacted in any test run.
#
# Sample data source: Incorporation-Report-20260802.xlsx (July 2026 file)

import io
import json
import shutil
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch, PropertyMock

import openpyxl
import pytest

from adapters.mca_last30days.fetch import MCALast30DaysAdapter, LISTING_URL
from adapters.mca_last30days.parse import (
    to_ingest_records,
    SOURCE_NAME,
    SHEET_ID_COLUMN,
)

# ── Real-sample fixture data ──────────────────────────────────────────────────
# Rows captured verbatim from the live July 2026 file on 2026-08-30.

INDIAN_ROWS = [
    ("U68100UW2026PTC255121", "Private", "1 BEEGHA PRIVATE LIMITED", "01-07-2026", "Non-government company", "68"),
    ("U42900ME2026PTC475508", "Private", "12 STRUCTURE ENGINEERING & CONSULTANCY PRIVATE LIMITED", "01-07-2026", "Non-government company", "42"),
    ("U35105TN2026PTC194789", "Private", "25 DEGREE GREEN ENERGY PRIVATE LIMITED", "01-07-2026", "Non-government company", "35"),
]

LLP_ROWS = [
    ("ACZ-6213", "BUYERSMAN LLP", "01-07-2026", "68"),
    ("ACZ-6220", "ALIF ATELIER LLP", "01-07-2026", "71"),
]

FOREIGN_ROWS = [
    ("F07061", "Schroder Corporate Services Limited", "01-07-2026", "82"),
    ("F07063", "International General Insurance Company (UK) Limited", "03-07-2026", "65"),
]

SAMPLE_FETCHED_AT = "2026-08-01T00:30:04+00:00"

# Column headers exactly as they appear in the live file (with leading space stripped)
INDIAN_HEADERS  = ["CIN", "Class", "Company Name", "Date Of Registration", "Company Type", "Activity Code"]
LLP_HEADERS     = ["LLPIN", "LLP Name", "Date of registration", "Activity"]
FOREIGN_HEADERS = ["FCIN", "Company Name", "Date of Registration", "Activity"]

TITLE_ROW = "Monthly Company (Indian and Foreign) and LLP's incorporation FO portal report    Date: 01-Aug-2026 00:30:04"


# ── XLSX fixture builder ──────────────────────────────────────────────────────

def _make_xlsx(
    path: Path,
    indian_rows: list[tuple] | None = None,
    llp_rows: list[tuple] | None = None,
    foreign_rows: list[tuple] | None = None,
    fetched_at: str | None = None,
) -> Path:
    """
    Build a minimal XLSX that mirrors the structure of the real MCA file:
    - Row 1: title (merged across columns)
    - Several blank rows
    - Header row at the position the live file uses
    - Data rows
    Written to ``path``. Also writes a sibling manifest if fetched_at is given.
    """
    indian_rows  = indian_rows  if indian_rows  is not None else INDIAN_ROWS
    llp_rows     = llp_rows     if llp_rows     is not None else LLP_ROWS
    foreign_rows = foreign_rows if foreign_rows is not None else FOREIGN_ROWS

    wb = openpyxl.Workbook()

    # ── Sheet 1: Indian Companies (header at row 9 in live file) ──────────────
    ws1 = wb.active
    ws1.title = "Indian Companies"
    ws1.append([TITLE_ROW])          # row 1 — title
    for _ in range(7):               # rows 2-8 — blank gap
        ws1.append([None])
    ws1.append([f" {h}" for h in INDIAN_HEADERS])  # row 9 — header (with leading space, as live)
    for row in indian_rows:
        ws1.append(list(row) + [None])  # trailing None column matches live file

    # ── Sheet 2: LLP Companies (header at row 10 in live file) ───────────────
    ws2 = wb.create_sheet("LLP Companies")
    ws2.append([TITLE_ROW])          # row 1
    for _ in range(8):               # rows 2-9
        ws2.append([None])
    ws2.append([f" {h}" for h in LLP_HEADERS])  # row 10
    for row in llp_rows:
        ws2.append(list(row) + [None])

    # ── Sheet 3: Foreign Companies (header at row 11 in live file) ───────────
    ws3 = wb.create_sheet("Foreign Companies")
    ws3.append([TITLE_ROW])          # row 1
    for _ in range(9):               # rows 2-10
        ws3.append([None])
    ws3.append([f" {h}" for h in FOREIGN_HEADERS])  # row 11
    for row in foreign_rows:
        ws3.append(list(row) + [None])

    wb.save(path)

    if fetched_at:
        manifest = {
            "source": SOURCE_NAME,
            "fetched_at": fetched_at,
            "raw_path": str(path),
            "row_count": len(indian_rows) + len(llp_rows) + len(foreign_rows),
            "status": "success",
        }
        manifest_path = path.parent / (path.stem + ".manifest.json")
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    return path


# ── Tests: fetch() ────────────────────────────────────────────────────────────

class TestMCALast30DaysAdapterFetch:
    """fetch() tests — Playwright is fully mocked, no real network calls."""

    def _make_download_mock(self, tmp_xlsx: Path):
        """Build a mock Playwright download object that 'saves' our fixture XLSX."""
        download = MagicMock()
        download.failure.return_value = None  # no failure
        download.suggested_filename = "Incorporation-Report-20260801.xlsx"

        def save_as(dest_path):
            shutil.copy2(str(tmp_xlsx), str(dest_path))

        download.save_as = save_as
        return download

    def _make_playwright_mocks(self, download_mock):
        """
        Build a mock sync_playwright() context manager that:
        - Exposes browser.new_context().new_page()
        - Has page.goto(), page.title(), page.locator().first.wait_for(), page.locator().first.click()
        - Triggers the download via page.expect_download()
        """
        download_cm = MagicMock()
        download_cm.__enter__ = MagicMock(return_value=download_cm)
        download_cm.__exit__ = MagicMock(return_value=False)
        download_cm.value = download_mock

        link_mock = MagicMock()
        link_mock.wait_for = MagicMock()
        link_mock.click = MagicMock()

        locator_mock = MagicMock()
        locator_mock.first = link_mock

        page_mock = MagicMock()
        page_mock.goto = MagicMock()
        page_mock.title = MagicMock(return_value="Incorporated Or Closed During The Month")
        page_mock.locator = MagicMock(return_value=locator_mock)
        page_mock.expect_download = MagicMock(return_value=download_cm)

        context_mock = MagicMock()
        context_mock.new_page = MagicMock(return_value=page_mock)

        browser_mock = MagicMock()
        browser_mock.new_context = MagicMock(return_value=context_mock)
        browser_mock.close = MagicMock()

        chromium_mock = MagicMock()
        chromium_mock.launch = MagicMock(return_value=browser_mock)

        pw_mock = MagicMock()
        pw_mock.chromium = chromium_mock

        pw_cm = MagicMock()
        pw_cm.__enter__ = MagicMock(return_value=pw_mock)
        pw_cm.__exit__ = MagicMock(return_value=False)

        return pw_cm

    def test_fetch_creates_xlsx_and_manifest(self, tmp_path):
        """fetch() should create a monthly XLSX and a sibling manifest JSON."""
        fixture_xlsx = tmp_path / "fixture.xlsx"
        _make_xlsx(fixture_xlsx)

        download_mock = self._make_download_mock(fixture_xlsx)
        pw_cm = self._make_playwright_mocks(download_mock)

        with patch("adapters.mca_last30days.fetch.sync_playwright", return_value=pw_cm):
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            raw_path = adapter.fetch()

        xlsx_path = Path(raw_path)
        assert xlsx_path.exists(), "XLSX file should exist after fetch()"
        assert xlsx_path.suffix == ".xlsx"
        assert xlsx_path.parent.name == "mca_last30days"

        # Manifest check
        from datetime import datetime as dt
        month_str = dt.now().strftime("%Y-%m")
        manifest_path = xlsx_path.parent / f"{month_str}.manifest.json"
        assert manifest_path.exists(), "Manifest should exist alongside XLSX"
        manifest = json.loads(manifest_path.read_text())
        assert manifest["source"] == SOURCE_NAME
        assert manifest["status"] == "success"
        assert manifest["row_count"] > 0

    def test_fetch_is_idempotent(self, tmp_path):
        """Second fetch() for the same month must not re-download."""
        fixture_xlsx = tmp_path / "fixture.xlsx"
        _make_xlsx(fixture_xlsx)

        download_mock = self._make_download_mock(fixture_xlsx)
        pw_cm = self._make_playwright_mocks(download_mock)

        with patch("adapters.mca_last30days.fetch.sync_playwright", return_value=pw_cm) as mock_pw:
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            path1 = adapter.fetch()
            calls_after_first = mock_pw.call_count

            path2 = adapter.fetch()  # should skip
            calls_after_second = mock_pw.call_count

        assert path1 == path2
        assert calls_after_second == calls_after_first, (
            "sync_playwright must not be called again on a second fetch() for the same month"
        )

    def test_fetch_raises_on_download_failure(self, tmp_path):
        """fetch() must raise RuntimeError when Playwright reports a download failure."""
        download_mock = MagicMock()
        download_mock.failure.return_value = "net::ERR_ABORTED"
        download_mock.suggested_filename = "Incorporation-Report-20260801.xlsx"

        pw_cm = self._make_playwright_mocks(download_mock)

        with patch("adapters.mca_last30days.fetch.sync_playwright", return_value=pw_cm):
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            with pytest.raises(RuntimeError, match="Download failed"):
                adapter.fetch()

    def test_fetch_raises_on_wrong_file_format(self, tmp_path):
        """fetch() must raise RuntimeError if the downloaded file is not XLSX/XLS."""
        download_mock = MagicMock()
        download_mock.failure.return_value = None
        download_mock.suggested_filename = "report.pdf"  # wrong format
        download_mock.save_as = MagicMock()

        pw_cm = self._make_playwright_mocks(download_mock)

        with patch("adapters.mca_last30days.fetch.sync_playwright", return_value=pw_cm):
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            with pytest.raises(RuntimeError, match="XLSX"):
                adapter.fetch()

    def test_fetch_raises_if_playwright_not_installed(self, tmp_path):
        """fetch() must raise RuntimeError with install instructions if Playwright is absent."""
        import adapters.mca_last30days.fetch as fetch_module

        with patch.object(fetch_module, "sync_playwright", None):
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            with pytest.raises(RuntimeError, match="playwright"):
                adapter.fetch()

    def test_fetch_file_named_with_year_month(self, tmp_path):
        """Output file must be named YYYY-MM.xlsx (monthly granularity, not daily)."""
        fixture_xlsx = tmp_path / "fixture.xlsx"
        _make_xlsx(fixture_xlsx)

        download_mock = self._make_download_mock(fixture_xlsx)
        pw_cm = self._make_playwright_mocks(download_mock)

        with patch("adapters.mca_last30days.fetch.sync_playwright", return_value=pw_cm):
            adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
            raw_path = adapter.fetch()

        stem = Path(raw_path).stem
        # Must match YYYY-MM pattern (10 chars, e.g. "2026-08")
        import re
        assert re.match(r"^\d{4}-\d{2}$", stem), (
            f"File must be named YYYY-MM.xlsx, got: {Path(raw_path).name!r}"
        )

    def test_adapter_to_ingest_records_delegates_to_parse(self, tmp_path):
        """MCALast30DaysAdapter.to_ingest_records() must equal parse.to_ingest_records()."""
        xlsx_path = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx_path, fetched_at=SAMPLE_FETCHED_AT)

        adapter = MCALast30DaysAdapter(raw_root=str(tmp_path))
        from_adapter = adapter.to_ingest_records(str(xlsx_path))
        from_parse   = to_ingest_records(str(xlsx_path))

        assert from_adapter == from_parse


# ── Tests: to_ingest_records() / parse.py ────────────────────────────────────

class TestToIngestRecords:
    """parse.py tests — file I/O only, no network or Playwright calls."""

    def test_produces_correct_shape(self, tmp_path):
        """Every record must have the four required top-level keys."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))

        expected_total = len(INDIAN_ROWS) + len(LLP_ROWS) + len(FOREIGN_ROWS)
        assert len(records) == expected_total

        for rec in records:
            assert rec["source"] == SOURCE_NAME
            assert isinstance(rec["source_record_id"], str)
            assert rec["source_record_id"] != ""
            assert isinstance(rec["fetched_at"], str) and rec["fetched_at"]
            assert isinstance(rec["raw_fields"], dict)

    def test_fetched_at_comes_from_manifest(self, tmp_path):
        """fetched_at must be read from the sibling manifest when it exists."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        for rec in records:
            assert rec["fetched_at"] == SAMPLE_FETCHED_AT

    def test_fetched_at_falls_back_to_mtime(self, tmp_path):
        """Without a manifest, fetched_at must be derived from file mtime."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=None)  # no manifest

        records = to_ingest_records(str(xlsx))
        for rec in records:
            assert rec["fetched_at"]
            from datetime import datetime
            datetime.fromisoformat(rec["fetched_at"])  # must be valid ISO string

    def test_indian_companies_source_record_id_is_cin(self, tmp_path):
        """Indian Companies records must have CIN as source_record_id."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, llp_rows=[], foreign_rows=[], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        assert len(records) == len(INDIAN_ROWS)
        for rec, expected_row in zip(records, INDIAN_ROWS):
            assert rec["source_record_id"] == expected_row[0]  # CIN is first column

    def test_llp_companies_source_record_id_is_llpin(self, tmp_path):
        """LLP Companies records must have LLPIN as source_record_id."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, indian_rows=[], foreign_rows=[], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        assert len(records) == len(LLP_ROWS)
        for rec, expected_row in zip(records, LLP_ROWS):
            assert rec["source_record_id"] == expected_row[0]  # LLPIN is first column

    def test_foreign_companies_source_record_id_is_fcin(self, tmp_path):
        """Foreign Companies records must have FCIN as source_record_id."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, indian_rows=[], llp_rows=[], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        assert len(records) == len(FOREIGN_ROWS)
        for rec, expected_row in zip(records, FOREIGN_ROWS):
            assert rec["source_record_id"] == expected_row[0]  # FCIN is first column

    def test_sheet_metadata_in_raw_fields(self, tmp_path):
        """Every record must have raw_fields._sheet indicating its origin sheet."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        sheets_seen = {rec["raw_fields"]["_sheet"] for rec in records}
        assert "Indian Companies" in sheets_seen
        assert "LLP Companies"    in sheets_seen
        assert "Foreign Companies" in sheets_seen

    def test_raw_fields_are_verbatim_strings(self, tmp_path):
        """raw_fields values must be plain strings, not ints/floats/None."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        for rec in records:
            for key, val in rec["raw_fields"].items():
                assert isinstance(val, str), (
                    f"raw_fields[{key!r}] must be str, got {type(val).__name__!r}: {val!r}"
                )

    def test_indian_raw_fields_columns(self, tmp_path):
        """Indian Companies records must contain the expected 6 source columns + _sheet."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, llp_rows=[], foreign_rows=[], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        for rec in records:
            for col in INDIAN_HEADERS:
                assert col in rec["raw_fields"], (
                    f"Expected column {col!r} missing from Indian Companies raw_fields"
                )
            assert "_sheet" in rec["raw_fields"]

    def test_llp_raw_fields_columns(self, tmp_path):
        """LLP Companies records must contain the expected 4 source columns + _sheet."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, indian_rows=[], foreign_rows=[], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        for rec in records:
            for col in LLP_HEADERS:
                assert col in rec["raw_fields"], (
                    f"Expected column {col!r} missing from LLP Companies raw_fields"
                )

    def test_ordering_indian_then_llp_then_foreign(self, tmp_path):
        """Records must be ordered: Indian Companies, then LLP, then Foreign."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))
        n_indian  = len(INDIAN_ROWS)
        n_llp     = len(LLP_ROWS)
        n_foreign = len(FOREIGN_ROWS)

        assert all(r["raw_fields"]["_sheet"] == "Indian Companies"  for r in records[:n_indian])
        assert all(r["raw_fields"]["_sheet"] == "LLP Companies"     for r in records[n_indian:n_indian+n_llp])
        assert all(r["raw_fields"]["_sheet"] == "Foreign Companies" for r in records[n_indian+n_llp:])

    def test_raises_on_nonexistent_file(self, tmp_path):
        """Must raise FileNotFoundError for a missing file."""
        with pytest.raises(FileNotFoundError):
            to_ingest_records(str(tmp_path / "no_such_file.xlsx"))

    def test_raises_on_corrupted_file(self, tmp_path):
        """Must raise ValueError for a file that is not a valid XLSX."""
        bad = tmp_path / "bad.xlsx"
        bad.write_bytes(b"this is not an xlsx file at all")
        with pytest.raises(ValueError, match="Cannot open XLSX"):
            to_ingest_records(str(bad))

    def test_raises_if_all_sheets_empty(self, tmp_path):
        """Must raise ValueError if all sheets have no data rows."""
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, indian_rows=[], llp_rows=[], foreign_rows=[], fetched_at=SAMPLE_FETCHED_AT)
        with pytest.raises(ValueError, match="0 records"):
            to_ingest_records(str(xlsx))

    def test_real_sample_data_from_live_file(self, tmp_path):
        """
        Integration sanity check using real rows from the live July 2026 file.
        Verifies the parser handles the actual data values correctly.
        """
        xlsx = tmp_path / "2026-08.xlsx"
        _make_xlsx(xlsx, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(xlsx))

        # Spot-check first Indian company
        indian = [r for r in records if r["raw_fields"]["_sheet"] == "Indian Companies"]
        assert indian[0]["source_record_id"] == "U68100UW2026PTC255121"
        assert indian[0]["raw_fields"]["Company Name"] == "1 BEEGHA PRIVATE LIMITED"
        assert indian[0]["raw_fields"]["Date Of Registration"] == "01-07-2026"
        assert indian[0]["raw_fields"]["Activity Code"] == "68"

        # Spot-check first LLP
        llps = [r for r in records if r["raw_fields"]["_sheet"] == "LLP Companies"]
        assert llps[0]["source_record_id"] == "ACZ-6213"
        assert llps[0]["raw_fields"]["LLP Name"] == "BUYERSMAN LLP"

        # Spot-check first Foreign company
        foreign = [r for r in records if r["raw_fields"]["_sheet"] == "Foreign Companies"]
        assert foreign[0]["source_record_id"] == "F07061"
