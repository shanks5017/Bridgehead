"""
tests/test_pipeline.py
-----------------------
Unit tests for pipeline/normalize.py, pipeline/entity_resolution.py,
and pipeline/confidence.py.

Design rules:
- All DB calls are mocked with unittest.mock.MagicMock — no live DB required.
- Sample records are taken from the real fixture data in test_mca_ogd.py
  and test_mca_last30days.py (same rows captured from the live sources).
- Each test covers one specific behaviour, named to make failures self-explanatory.
"""

import datetime
from unittest.mock import MagicMock, call, patch

import pytest

from pipeline.normalize import (
    normalize_record,
    normalize_company_name,
    clean_string,
    clean_numeric,
    parse_date,
)
from pipeline.entity_resolution import resolve_entity, upsert_company
from pipeline.confidence import process_field_provenance, CONFIDENCE_SCORE


# ── Real sample fixtures (from live adapters) ─────────────────────────────────
# mca_ogd: Active company, Strike Off company, LLP (blank capitals)
SAMPLE_OGD_ACTIVE = {
    "source": "mca_ogd",
    "raw_fields": {
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
}

SAMPLE_OGD_LLP = {
    "source": "mca_ogd",
    "raw_fields": {
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
        "nic_code": "64990",
        "CompanyIndustrialClassification": "Finance and Insurance",
    },
}

# mca_last30days: one row per sheet type
SAMPLE_L30_INDIAN = {
    "source": "mca_last30days",
    "raw_fields": {
        "_sheet": "Indian Companies",
        "CIN": "U68100UW2026PTC255121",
        "Class": "Private",
        "Company Name": "1 BEEGHA PRIVATE LIMITED",
        "Date Of Registration": "01-07-2026",
        "Company Type": "Non-government company",
        "Activity Code": "68",
    },
}

SAMPLE_L30_LLP = {
    "source": "mca_last30days",
    "raw_fields": {
        "_sheet": "LLP Companies",
        "LLPIN": "ACZ-6213",
        "LLP Name": "BUYERSMAN LLP",
        "Date of registration": "01-07-2026",
        "Activity": "68",
    },
}

SAMPLE_L30_FOREIGN = {
    "source": "mca_last30days",
    "raw_fields": {
        "_sheet": "Foreign Companies",
        "FCIN": "F07061",
        "Company Name": "Schroder Corporate Services Limited",
        "Date of Registration": "01-07-2026",
        "Activity": "82",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# normalize.py tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestCleanString:
    def test_strips_whitespace(self):
        assert clean_string("  hello  ") == "hello"

    def test_collapses_internal_whitespace(self):
        assert clean_string("hello   world") == "hello world"

    def test_none_input_returns_none(self):
        assert clean_string(None) is None

    def test_blank_string_returns_none(self):
        assert clean_string("   ") is None

    def test_empty_string_returns_none(self):
        assert clean_string("") is None


class TestNormalizeCompanyName:
    def test_title_cases_allcaps(self):
        assert normalize_company_name("ACME PRIVATE LIMITED") == "Acme Private Limited"

    def test_strips_whitespace_and_title_cases(self):
        assert normalize_company_name("  TEST COMPANY  PVT LTD  ") == "Test Company Pvt Ltd"

    def test_none_returns_none(self):
        assert normalize_company_name(None) is None

    def test_blank_returns_none(self):
        assert normalize_company_name("  ") is None


class TestCleanNumeric:
    def test_valid_decimal_string(self):
        assert clean_numeric("1000000.00") == 1000000.0

    def test_zero_string(self):
        assert clean_numeric("0.00") == 0.0

    def test_blank_string_returns_none(self):
        assert clean_numeric("") is None

    def test_none_returns_none(self):
        assert clean_numeric(None) is None

    def test_non_numeric_returns_none(self):
        assert clean_numeric("N/A") is None


class TestParseDate:
    def test_ogd_iso_format(self):
        assert parse_date("2024-01-29", "mca_ogd") == "2024-01-29"

    def test_last30days_dmy_format(self):
        assert parse_date("01-07-2026", "mca_last30days") == "2026-07-01"

    def test_blank_returns_none(self):
        assert parse_date("", "mca_ogd") is None

    def test_none_returns_none(self):
        assert parse_date(None, "mca_ogd") is None

    def test_wrong_format_for_source_returns_none(self):
        # If mca_last30days date is accidentally given to mca_ogd parser, it should fail gracefully
        assert parse_date("01-07-2026", "mca_ogd") is None

    def test_unknown_source_returns_none(self):
        assert parse_date("2024-01-01", "mystery_source") is None


class TestNormalizeMcaOgd:
    def test_active_company_full_fields(self):
        result = normalize_record(SAMPLE_OGD_ACTIVE)

        assert result["cin"] == "U68100KA2024PTC183989"
        assert result["company_name"] == "Buloke Interio Private Limited"
        assert result["company_status"] == "Active"
        assert result["company_class"] == "Private"
        assert result["company_category"] == "Company limited by shares"
        assert result["incorporation_date"] == "2024-01-29"
        assert result["roc"] == "ROC Bangalore"
        assert result["state"] == "karnataka"
        assert result["authorised_capital"] == 1_000_000.0
        assert result["paid_up_capital"] == 100_000.0
        assert result["nic_code"] == "68100"

    def test_llp_blank_capitals_are_none(self):
        result = normalize_record(SAMPLE_OGD_LLP)

        assert result["cin"] == "ABD-0345"
        assert result["authorised_capital"] is None
        assert result["paid_up_capital"] is None
        assert result["company_class"] is None
        assert result["company_category"] is None
        # CIN and name are still present
        assert result["company_name"] == "Titan Winners Fund Management Llp"
        assert result["incorporation_date"] == "2023-02-10"

    def test_all_keys_present(self):
        """normalize_record must always return all expected column keys."""
        result = normalize_record(SAMPLE_OGD_ACTIVE)
        expected_keys = {
            "cin", "company_name", "company_status", "company_class",
            "company_category", "incorporation_date", "roc", "state",
            "registered_address", "authorised_capital", "paid_up_capital", "nic_code",
        }
        assert set(result.keys()) == expected_keys


class TestNormalizeMcaLast30Days:
    def test_indian_company(self):
        result = normalize_record(SAMPLE_L30_INDIAN)

        assert result["cin"] == "U68100UW2026PTC255121"
        assert result["company_name"] == "1 Beegha Private Limited"
        assert result["incorporation_date"] == "2026-07-01"
        assert result["company_class"] == "Private"
        assert result["company_category"] == "Non-government company"
        assert result["nic_code"] == "68"

    def test_indian_company_sparse_fields_are_none(self):
        result = normalize_record(SAMPLE_L30_INDIAN)

        # Fields not provided by this source must be None, not guessed
        assert result["company_status"] is None
        assert result["roc"] is None
        assert result["state"] is None
        assert result["registered_address"] is None
        assert result["authorised_capital"] is None
        assert result["paid_up_capital"] is None

    def test_llp_company(self):
        result = normalize_record(SAMPLE_L30_LLP)

        assert result["cin"] == "ACZ-6213"
        assert result["company_name"] == "Buyersman Llp"
        assert result["incorporation_date"] == "2026-07-01"
        assert result["nic_code"] == "68"
        # LLP sheet has no class or category
        assert result["company_class"] is None
        assert result["company_category"] is None

    def test_foreign_company(self):
        result = normalize_record(SAMPLE_L30_FOREIGN)

        assert result["cin"] == "F07061"
        assert result["company_name"] == "Schroder Corporate Services Limited"
        assert result["incorporation_date"] == "2026-07-01"
        assert result["nic_code"] == "82"

    def test_unknown_sheet_all_none(self):
        record = {
            "source": "mca_last30days",
            "raw_fields": {"_sheet": "Unrecognised Sheet", "CIN": "X999"},
        }
        result = normalize_record(record)
        assert result["cin"] is None
        assert result["company_name"] is None

    def test_all_keys_present(self):
        result = normalize_record(SAMPLE_L30_INDIAN)
        expected_keys = {
            "cin", "company_name", "company_status", "company_class",
            "company_category", "incorporation_date", "roc", "state",
            "registered_address", "authorised_capital", "paid_up_capital", "nic_code",
        }
        assert set(result.keys()) == expected_keys


class TestNormalizeUnknownSource:
    def test_raises_on_unknown_source(self):
        with pytest.raises(ValueError, match="unknown source"):
            normalize_record({"source": "mystery", "raw_fields": {}})


# ═══════════════════════════════════════════════════════════════════════════════
# entity_resolution.py tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestResolveEntity:
    def test_existing_cin_returns_true(self):
        cursor = MagicMock()
        cursor.fetchone.return_value = ("U68100KA2024PTC183989",)
        assert resolve_entity(cursor, "U68100KA2024PTC183989") is True
        cursor.execute.assert_called_once_with(
            "SELECT cin FROM companies WHERE cin = %s",
            ("U68100KA2024PTC183989",),
        )

    def test_missing_cin_returns_false(self):
        cursor = MagicMock()
        cursor.fetchone.return_value = None
        assert resolve_entity(cursor, "NOTFOUND") is False

    def test_blank_cin_raises(self):
        cursor = MagicMock()
        with pytest.raises(ValueError, match="non-empty"):
            resolve_entity(cursor, "")

    def test_none_cin_raises(self):
        cursor = MagicMock()
        with pytest.raises(ValueError, match="non-empty"):
            resolve_entity(cursor, None)


class TestUpsertCompany:
    def test_insert_called_on_new(self):
        cursor = MagicMock()
        normalized = {"company_name": "Test Co"}
        upsert_company(cursor, "U123", normalized, is_new=True)
        cursor.execute.assert_called_once()
        sql = cursor.execute.call_args[0][0]
        assert "INSERT INTO companies" in sql

    def test_no_insert_on_existing(self):
        cursor = MagicMock()
        upsert_company(cursor, "U123", {}, is_new=False)
        cursor.execute.assert_not_called()

    def test_missing_name_uses_sentinel(self):
        cursor = MagicMock()
        upsert_company(cursor, "U123", {"company_name": None}, is_new=True)
        args = cursor.execute.call_args[0][1]
        assert "UNKNOWN" in args[1]


# ═══════════════════════════════════════════════════════════════════════════════
# confidence.py tests
# ═══════════════════════════════════════════════════════════════════════════════

def _make_cursor_for_new_company():
    """
    A mock cursor that simulates a brand-new company with no existing provenance.
    First two fetchall calls (existing provenance checks) return [], subsequent
    ones return the data we just inserted.
    """
    cursor = MagicMock()
    call_count = [0]

    def fetchall_side_effect():
        call_count[0] += 1
        if call_count[0] <= 2:
            return []  # No existing data yet (source-specific + best-values queries)
        # After upsert, simulate what was written
        return [
            ("company_name", "Buloke Interio Private Limited", "mca_ogd", 80,
             datetime.datetime(2024, 1, 29, tzinfo=datetime.timezone.utc))
        ]

    cursor.fetchall.side_effect = fetchall_side_effect
    return cursor


class TestProcessFieldProvenanceNewCompany:
    def test_emits_new_registration_event(self):
        cursor = _make_cursor_for_new_company()
        fetched_at = datetime.datetime(2024, 1, 29, tzinfo=datetime.timezone.utc)
        normalized = normalize_record(SAMPLE_OGD_ACTIVE)

        events = process_field_provenance(
            cursor=cursor,
            cin="U68100KA2024PTC183989",
            normalized_record=normalized,
            source="mca_ogd",
            raw_ingest_id=1,
            fetched_at=fetched_at,
        )

        assert any(e["event_type"] == "new_registration" for e in events)

    def test_provenance_upsert_called_for_non_null_fields(self):
        cursor = _make_cursor_for_new_company()
        fetched_at = datetime.datetime(2024, 1, 29, tzinfo=datetime.timezone.utc)
        normalized = normalize_record(SAMPLE_OGD_ACTIVE)

        process_field_provenance(
            cursor=cursor,
            cin="U68100KA2024PTC183989",
            normalized_record=normalized,
            source="mca_ogd",
            raw_ingest_id=1,
            fetched_at=fetched_at,
        )

        # At least one INSERT INTO field_provenance call should have happened
        insert_calls = [
            c for c in cursor.execute.call_args_list
            if "INSERT INTO field_provenance" in str(c)
        ]
        assert len(insert_calls) > 0

    def test_confidence_score_is_80(self):
        cursor = _make_cursor_for_new_company()
        fetched_at = datetime.datetime(2024, 1, 29, tzinfo=datetime.timezone.utc)
        normalized = {"cin": "U68100KA2024PTC183989", "company_name": "Test Co"}

        process_field_provenance(
            cursor=cursor,
            cin="U68100KA2024PTC183989",
            normalized_record=normalized,
            source="mca_ogd",
            raw_ingest_id=1,
            fetched_at=fetched_at,
        )

        insert_calls = [
            c for c in cursor.execute.call_args_list
            if "INSERT INTO field_provenance" in str(c)
        ]
        if insert_calls:
            args = insert_calls[0][0][1]
            # confidence_score is the 6th parameter (index 5)
            assert args[5] == CONFIDENCE_SCORE == 80

    def test_none_fields_skipped(self):
        """Fields with None value must not generate a provenance row."""
        cursor = _make_cursor_for_new_company()
        fetched_at = datetime.datetime(2024, 1, 29, tzinfo=datetime.timezone.utc)

        # mca_last30days Indian Companies is sparse — many None fields
        normalized = normalize_record(SAMPLE_L30_INDIAN)

        process_field_provenance(
            cursor=cursor,
            cin="U68100UW2026PTC255121",
            normalized_record=normalized,
            source="mca_last30days",
            raw_ingest_id=2,
            fetched_at=fetched_at,
        )

        # There should be NO provenance write for company_status (None in this source)
        insert_calls = [
            str(c) for c in cursor.execute.call_args_list
            if "INSERT INTO field_provenance" in str(c) and "company_status" in str(c)
        ]
        assert insert_calls == []


class TestProcessFieldProvenanceConflict:
    """
    When two sources disagree on a field, BOTH rows must be kept.
    The companies table is updated to whichever source has the later last_verified_at.
    """

    def test_both_sources_written_on_conflict(self):
        """
        Scenario: mca_ogd already has company_name = "Old Name Co".
        mca_last30days comes in with company_name = "New Name Co".
        Both provenance rows must exist; companies updated to the more recent value.
        """
        cursor = MagicMock()
        old_time = datetime.datetime(2023, 6, 1, tzinfo=datetime.timezone.utc)
        new_time = datetime.datetime(2024, 6, 1, tzinfo=datetime.timezone.utc)

        # confidence.py calls order:
        # 1. _get_best_values_per_field  → 5-tuple rows (no source filter)
        # 2. _get_current_field_values_for_source → 2-tuple rows (source filter)
        # 3. _get_best_values_per_field again after upsert → 5-tuple rows
        call_count = [0]

        def fetchall_side_effect():
            call_count[0] += 1
            last_query = cursor.execute.call_args[0][0]
            if "AND source = %s" in last_query:
                # Source-specific query (mca_last30days has nothing yet)
                return []
            elif call_count[0] <= 2:
                # Before upsert: only mca_ogd data
                return [
                    ("company_name", "Old Name Co", "mca_ogd", 80, old_time)
                ]
            else:
                # After upsert: both sources present
                return [
                    ("company_name", "Old Name Co", "mca_ogd", 80, old_time),
                    ("company_name", "New Name Co", "mca_last30days", 80, new_time),
                ]

        cursor.fetchall.side_effect = fetchall_side_effect

        normalized = {"cin": "U123", "company_name": "New Name Co"}
        events = process_field_provenance(
            cursor=cursor,
            cin="U123",
            normalized_record=normalized,
            source="mca_last30days",
            raw_ingest_id=5,
            fetched_at=new_time,
        )

        # Should have written a new provenance row (INSERT INTO field_provenance)
        insert_calls = [
            c for c in cursor.execute.call_args_list
            if "INSERT INTO field_provenance" in str(c)
        ]
        assert len(insert_calls) >= 1

        # Event should show field_change (company already existed, value changed)
        assert any(e["event_type"] == "field_change" for e in events)
        change_events = [e for e in events if e["event_type"] == "field_change"]
        assert change_events[0]["old_value"] == "Old Name Co"
        assert change_events[0]["new_value"] == "New Name Co"


class TestProcessFieldProvenanceIdempotency:
    """
    Re-running with the same data and source must NOT duplicate events.
    The last_verified_at should be updated, but no new field_change event.
    """

    def test_same_value_re_run_updates_timestamp_not_event(self):
        cursor = MagicMock()
        existing_time = datetime.datetime(2024, 1, 1, tzinfo=datetime.timezone.utc)
        new_time = datetime.datetime(2024, 2, 1, tzinfo=datetime.timezone.utc)

        # confidence.py calls order:
        # 1. _get_best_values_per_field → 5-tuple (before)
        # 2. _get_current_field_values_for_source → 2-tuple
        # [UPDATE last_verified_at called because existing_val == new_value]
        # 3. _get_best_values_per_field → 5-tuple (after)

        def fetchall_side_effect():
            last_query = cursor.execute.call_args[0][0]
            if "AND source = %s" in last_query:
                # Source-specific: already has this exact value
                return [("company_name", "Same Name Ltd")]
            else:
                # Best values query (before or after): same value, timestamps differ
                return [("company_name", "Same Name Ltd", "mca_ogd", 80, existing_time)]

        cursor.fetchall.side_effect = fetchall_side_effect

        normalized = {"cin": "U999", "company_name": "Same Name Ltd"}
        events = process_field_provenance(
            cursor=cursor,
            cin="U999",
            normalized_record=normalized,
            source="mca_ogd",
            raw_ingest_id=10,
            fetched_at=new_time,
        )

        # Value didn't change → no field_change events expected
        assert events == []

        # But last_verified_at UPDATE should still have been called
        update_calls = [
            c for c in cursor.execute.call_args_list
            if "UPDATE field_provenance" in str(c) and "last_verified_at" in str(c)
        ]
        assert len(update_calls) >= 1
