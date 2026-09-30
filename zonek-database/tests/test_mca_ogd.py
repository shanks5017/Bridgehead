# tests/test_mca_ogd.py
#
# Tests for the mca_ogd adapter (fetch.py + parse.py).
#
# Design:
#   - fetch() is tested with a mocked requests.get — never hits the real endpoint.
#   - to_ingest_records() is tested against a small CSV fixture derived from a real
#     sample of the live dataset (rows captured on 2026-08-30).
#   - The real endpoint (3.6M rows) is NOT called in any test run.

import csv
import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from adapters.mca_ogd.fetch import MCAOGDAdapter, EXPECTED_COLUMNS  # noqa: F401
from adapters.mca_ogd.parse import SOURCE_NAME  # noqa: F401
from adapters.mca_ogd.parse import to_ingest_records, SOURCE_ID_COLUMN

# ── Real-sample fixture data ──────────────────────────────────────────────────
# Three rows taken verbatim from the live API / downloaded CSV on 2026-08-30.
# Covers: Active company, Strike Off company, LLP (blank financial fields).

SAMPLE_ROWS: list[dict] = [
    {
        "CIN": "U68100KA2024PTC183989",
        "CompanyName": "BULOKE INTERIO PRIVATE LIMITED",
        "CompanyROCcode": "ROC Bangalore",
        "CompanyCategory": "Company limited by shares",
        "CompanySubCategory": "Non-government company",
        "CompanyClass": "Private",
        "AuthorizedCapital": "1000000.00",
        "PaidupCapital": "100000.00",
        "CompanyRegistrationdate_date": "2024-01-29",
        "Registered_Office_Address": "No.2, Khatha No.322/2,1st Floor,Kempapura Coffee Board,Bangalore North,Bangalore,Karnataka,560024-India",
        "Listingstatus": "Unlisted",
        "CompanyStatus": "Active",
        "CompanyStateCode": "karnataka",
        "CompanyIndian/Foreign Company": "91",
        "nic_code": "68100",
        "CompanyIndustrialClassification": "Real Estate and Renting",
    },
    {
        "CIN": "U72200KA2000PTC026337",
        "CompanyName": "INFOSTREAM SOFTWARE TECHNOLOGIES PRIVATE LIMITED",
        "CompanyROCcode": "ROC Bangalore",
        "CompanyCategory": "Company limited by shares",
        "CompanySubCategory": "Non-government company",
        "CompanyClass": "Private",
        "AuthorizedCapital": "500000.00",
        "PaidupCapital": "0.00",
        "CompanyRegistrationdate_date": "2000-02-04",
        "Registered_Office_Address": "485,13TH CROSS 4TH PHASE,PEENYA INDUSTRIAL AREA,BANGALORE-560058.52.,Karnataka,000000-India",
        "Listingstatus": "Unlisted",
        "CompanyStatus": "Strike Off",
        "CompanyStateCode": "karnataka",
        "CompanyIndian/Foreign Company": "India",
        "nic_code": "72200",
        "CompanyIndustrialClassification": "Business Services",
    },
    {
        # LLP record — blank financial/category fields, LLPIN-style CIN
        "CIN": "ABD-0345",
        "CompanyName": "Titan Winners Fund Management LLP",
        "CompanyROCcode": "ROC Haryana",
        "CompanyCategory": "",
        "CompanySubCategory": "",
        "CompanyClass": "",
        "AuthorizedCapital": "",
        "PaidupCapital": "",
        "CompanyRegistrationdate_date": "2023-02-10",
        "Registered_Office_Address": "3rd Floor,M3M Urbana Business Park,North Tower,sector 67,Bhondsi,Gurgaon,Haryana,India-122102",
        "Listingstatus": "",
        "CompanyStatus": "Active",
        "CompanyStateCode": "haryana",
        "CompanyIndian/Foreign Company": "",
        "nic_code": "",
        "CompanyIndustrialClassification": "Finance",
    },
]

SAMPLE_FETCHED_AT = "2026-08-30T02:30:00+00:00"

FIELDNAMES = list(SAMPLE_ROWS[0].keys())


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_api_page(records: list[dict], total: int, offset: int = 0) -> dict:
    """Construct a data.gov.in-shaped JSON API response."""
    return {
        "status": "ok",
        "version": "2.2.0",
        "title": "Registrars of Companies (RoC)-wise Company Master Data",
        "total": total,
        "count": len(records),
        "limit": str(len(records) or 1),
        "offset": str(offset),
        "field": [{"name": f, "id": f, "type": "keyword"} for f in FIELDNAMES],
        "records": records,
    }


def _write_sample_csv(path: Path, rows: list[dict] | None = None, fetched_at: str | None = None) -> Path:
    """Write a sample CSV (and optionally a sibling manifest) to path."""
    rows = rows or SAMPLE_ROWS
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    if fetched_at:
        manifest = {
            "source": "mca_ogd",
            "fetched_at": fetched_at,
            "raw_path": str(path),
            "row_count": len(rows),
            "status": "success",
        }
        manifest_path = path.parent / (path.stem + ".manifest.json")
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    return path


# ── Tests: fetch() ────────────────────────────────────────────────────────────

class TestMCAOGDAdapterFetch:
    """fetch() tests — all HTTP calls are mocked, no real endpoint hit."""

    def test_raises_if_no_api_key(self):
        """Constructor must raise ValueError immediately when no API key is provided."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove DATA_GOV_API_KEY if present in environment
            env = {k: v for k, v in os.environ.items() if k != "DATA_GOV_API_KEY"}
            with patch.dict(os.environ, env, clear=True):
                with pytest.raises(ValueError, match="API key"):
                    MCAOGDAdapter(api_key="")

    def test_fetch_creates_csv_and_manifest(self, tmp_path):
        """fetch() should create a dated CSV and a sibling manifest JSON."""
        total = len(SAMPLE_ROWS)
        mock_responses = [
            _make_api_page([SAMPLE_ROWS[0]], total=total, offset=0),  # probe (limit=1)
            _make_api_page(SAMPLE_ROWS, total=total, offset=0),        # full page
        ]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(side_effect=mock_responses)

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp):
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            raw_path = adapter.fetch()

        csv_path = Path(raw_path)
        assert csv_path.exists(), "CSV file should exist after fetch()"
        assert csv_path.suffix == ".csv"
        assert csv_path.parent.name == "mca_ogd"

        # Verify manifest
        manifest_path = csv_path.parent / (csv_path.stem + ".manifest.json")
        assert manifest_path.exists(), "Manifest JSON should exist alongside the CSV"
        manifest = json.loads(manifest_path.read_text())
        assert manifest["source"] == "mca_ogd"
        assert manifest["status"] == "success"
        assert manifest["row_count"] == total
        assert manifest["raw_path"] == str(csv_path)

    def test_fetch_csv_has_correct_headers_and_row_count(self, tmp_path):
        """The written CSV must have the correct headers and exactly N data rows."""
        total = len(SAMPLE_ROWS)
        probe_resp = _make_api_page([SAMPLE_ROWS[0]], total=total)
        full_resp = _make_api_page(SAMPLE_ROWS, total=total)

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(side_effect=[probe_resp, full_resp])

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp):
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            raw_path = adapter.fetch()

        with open(raw_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            rows = list(reader)
            # fieldnames are populated after iteration or via attribute before
            actual_fieldnames = reader.fieldnames

        assert set(actual_fieldnames) == set(FIELDNAMES), (
            f"Expected columns {set(FIELDNAMES)}, got {set(actual_fieldnames)}"
        )
        assert len(rows) == total

    def test_fetch_is_idempotent(self, tmp_path):
        """Calling fetch() a second time for the same date must not re-download."""
        total = len(SAMPLE_ROWS)
        probe_resp = _make_api_page([SAMPLE_ROWS[0]], total=total)
        full_resp = _make_api_page(SAMPLE_ROWS, total=total)

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(side_effect=[probe_resp, full_resp])

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp) as mock_get:
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            path1 = adapter.fetch()
            call_count_after_first = mock_get.call_count

            path2 = adapter.fetch()  # second call — should skip
            call_count_after_second = mock_get.call_count

        assert path1 == path2
        assert call_count_after_second == call_count_after_first, (
            "requests.get must not be called again on a second fetch() for the same date"
        )

    def test_fetch_raises_on_api_error(self, tmp_path):
        """fetch() must raise RuntimeError when the API returns status=error."""
        error_resp = {"status": "error", "message": "Meta not found", "total": 0, "records": []}

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(return_value=error_resp)

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp):
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            with pytest.raises(RuntimeError):
                adapter.fetch()

    def test_fetch_raises_on_zero_total(self, tmp_path):
        """fetch() must raise RuntimeError when total=0 (prevents empty file)."""
        empty_resp = _make_api_page([], total=0)

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(return_value=empty_resp)

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp):
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            with pytest.raises(RuntimeError, match="total=0"):
                adapter.fetch()

    def test_no_partial_file_on_write_error(self, tmp_path):
        """If CSV write fails mid-write, no .tmp or .csv file should remain on disk."""
        total = len(SAMPLE_ROWS)
        probe_resp = _make_api_page([SAMPLE_ROWS[0]], total=total)
        full_resp = _make_api_page(SAMPLE_ROWS, total=total)

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json = MagicMock(side_effect=[probe_resp, full_resp])

        from datetime import date
        today = date.today().isoformat()

        real_path_open = Path.open

        def path_open_that_fails_on_tmp(self_path, *args, **kwargs):
            if str(self_path).endswith(".tmp"):
                raise IOError("disk full (simulated)")
            return real_path_open(self_path, *args, **kwargs)

        with patch("adapters.mca_ogd.fetch.requests.get", return_value=mock_resp):
            adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
            csv_path = tmp_path / "mca_ogd" / f"{today}.csv"
            tmp_file  = csv_path.with_suffix(".tmp")

            with patch.object(Path, "open", path_open_that_fails_on_tmp):
                with pytest.raises(IOError):
                    adapter.fetch()

        assert not csv_path.exists(), "Final .csv must not exist after a failed write"
        assert not tmp_file.exists(), ".tmp file must be cleaned up after a failed write"


# ── Tests: to_ingest_records() ────────────────────────────────────────────────

class TestToIngestRecords:
    """to_ingest_records() / parse.py tests — no network calls, file I/O only."""

    def test_produces_correct_shape(self, tmp_path):
        """Every record must have the required top-level keys with correct types."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))

        assert len(records) == len(SAMPLE_ROWS)
        for rec in records:
            assert rec["source"] == "mca_ogd"
            assert isinstance(rec["source_record_id"], str)
            assert isinstance(rec["fetched_at"], str)
            assert len(rec["fetched_at"]) > 0
            assert isinstance(rec["raw_fields"], dict)

    def test_source_record_id_is_cin(self, tmp_path):
        """source_record_id must be the verbatim CIN value from the row."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))
        expected_cins = [row["CIN"] for row in SAMPLE_ROWS]
        actual_ids = [rec["source_record_id"] for rec in records]
        assert actual_ids == expected_cins

    def test_raw_fields_are_verbatim(self, tmp_path):
        """raw_fields must be the verbatim CSV row — no casting or cleaning."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))

        for rec, expected_row in zip(records, SAMPLE_ROWS):
            for col, expected_val in expected_row.items():
                assert rec["raw_fields"][col] == expected_val, (
                    f"Column {col!r}: expected {expected_val!r}, got {rec['raw_fields'][col]!r}"
                )

    def test_fetched_at_comes_from_manifest(self, tmp_path):
        """fetched_at must be loaded from the sibling manifest when it exists."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))
        assert all(rec["fetched_at"] == SAMPLE_FETCHED_AT for rec in records), (
            "fetched_at must come from manifest, not default to current time"
        )

    def test_fetched_at_falls_back_to_mtime(self, tmp_path):
        """Without a manifest, fetched_at must fall back to the file's mtime (not blank)."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=None)  # no manifest written

        records = to_ingest_records(str(csv_path))
        for rec in records:
            assert rec["fetched_at"]  # must be non-empty
            # Should be a valid ISO datetime string
            from datetime import datetime
            datetime.fromisoformat(rec["fetched_at"])  # raises if invalid

    def test_llp_record_with_blank_fields(self, tmp_path):
        """LLP rows with blank financial fields must parse without error."""
        llp_row = SAMPLE_ROWS[2]  # ABD-0345 (LLP)
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, rows=[llp_row], fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))
        assert len(records) == 1
        rec = records[0]
        assert rec["source_record_id"] == "ABD-0345"
        assert rec["raw_fields"]["AuthorizedCapital"] == ""
        assert rec["raw_fields"]["CompanyCategory"] == ""

    def test_raises_on_missing_cin_column(self, tmp_path):
        """Must raise ValueError if the CIN column is absent (schema drift guard)."""
        bad_csv = tmp_path / "2026-08-30.csv"
        # Write a CSV without the CIN column
        rows_no_cin = [{k: v for k, v in row.items() if k != "CIN"} for row in SAMPLE_ROWS]
        fieldnames_no_cin = [f for f in FIELDNAMES if f != "CIN"]
        with bad_csv.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames_no_cin)
            writer.writeheader()
            writer.writerows(rows_no_cin)

        with pytest.raises(ValueError, match="CIN"):
            to_ingest_records(str(bad_csv))

    def test_raises_on_empty_file(self, tmp_path):
        """Must raise ValueError on a CSV with only a header and no data rows."""
        empty_csv = tmp_path / "2026-08-30.csv"
        with empty_csv.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=FIELDNAMES)
            writer.writeheader()
            # No data rows written

        with pytest.raises(ValueError, match="zero data rows"):
            to_ingest_records(str(empty_csv))

    def test_raises_on_nonexistent_file(self, tmp_path):
        """Must raise FileNotFoundError when the file doesn't exist."""
        with pytest.raises(FileNotFoundError):
            to_ingest_records(str(tmp_path / "does_not_exist.csv"))

    def test_all_16_columns_present_in_raw_fields(self, tmp_path):
        """raw_fields must contain all 16 source columns, no more, no less (for standard rows)."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        records = to_ingest_records(str(csv_path))
        for rec in records:
            assert set(rec["raw_fields"].keys()) == set(FIELDNAMES)

    def test_adapter_to_ingest_records_delegates_to_parse(self, tmp_path):
        """MCAOGDAdapter.to_ingest_records() must return the same result as parse.to_ingest_records()."""
        csv_path = tmp_path / "2026-08-30.csv"
        _write_sample_csv(csv_path, fetched_at=SAMPLE_FETCHED_AT)

        adapter = MCAOGDAdapter(api_key="test-key-dummy", raw_root=str(tmp_path))
        from_adapter = adapter.to_ingest_records(str(csv_path))
        from_parse   = to_ingest_records(str(csv_path))

        assert from_adapter == from_parse
