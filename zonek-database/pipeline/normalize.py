"""
pipeline/normalize.py
---------------------
Role: Pipeline/Normalization Engineer
Owned by: this file — do not edit from adapter or API roles.

Converts a raw_entity_ingest record (as produced by either adapter's
to_ingest_records()) into a cleaned dict that maps 1:1 onto the
`companies` table columns.

Design rules:
- Never guess a missing value. Absent fields → None.
- Never raise on malformed input — return None for unparseable values
  and let the caller skip the field via confidence.py.
- All business logic about column names belongs here, not in adapters.
"""

import datetime
import re


# ── Helpers ───────────────────────────────────────────────────────────────────

def clean_string(val) -> str | None:
    """Strip, collapse internal whitespace. Returns None for blank/None."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    # Collapse runs of internal whitespace to a single space
    return re.sub(r"\s+", " ", s)


def normalize_company_name(val) -> str | None:
    """
    Clean whitespace AND apply title-case normalisation.
    e.g. "  ACME PRIVATE  LIMITED  " → "Acme Private Limited"

    We use Python's str.title() which handles the common case well.
    Edge case: acronyms like "LLP", "PVT" will be title-cased as
    "Llp", "Pvt" — acceptable for Phase 1; a more advanced approach
    can be added as a Phase 2 polish item if the product surfaces names
    directly to end users.
    """
    s = clean_string(val)
    if s is None:
        return None
    return s.title()


def parse_date(date_str, source: str) -> str | None:
    """
    Parse a date string to ISO-8601 (YYYY-MM-DD) string, or None on failure.

    mca_ogd      → YYYY-MM-DD  (already ISO, just validate)
    mca_last30days → DD-MM-YYYY
    """
    if not date_str:
        return None
    s = str(date_str).strip()
    if not s:
        return None

    fmt_map = {
        "mca_ogd": "%Y-%m-%d",
        "mca_last30days": "%d-%m-%Y",
    }
    fmt = fmt_map.get(source)
    if fmt is None:
        return None  # Unknown source — don't guess format

    try:
        return datetime.datetime.strptime(s, fmt).date().isoformat()
    except ValueError:
        return None


def clean_numeric(val) -> float | None:
    """
    Cast a string-encoded decimal (e.g. "1000000.00") to float.
    Returns None for blank strings, non-numeric strings, or None input.
    """
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


# ── Source-specific normalizers ───────────────────────────────────────────────

def normalize_mca_ogd(raw_fields: dict) -> dict:
    """
    Normalizes a raw record from the mca_ogd adapter.

    Column name reference (from adapters/mca_ogd/README.md):
      CIN, CompanyName, CompanyROCcode, CompanyCategory, CompanySubCategory,
      CompanyClass, AuthorizedCapital, PaidupCapital,
      CompanyRegistrationdate_date (YYYY-MM-DD), Registered_Office_Address,
      Listingstatus, CompanyStatus, CompanyStateCode, nic_code
    """
    return {
        "cin": clean_string(raw_fields.get("CIN")),
        "company_name": normalize_company_name(raw_fields.get("CompanyName")),
        "company_status": clean_string(raw_fields.get("CompanyStatus")),
        "company_class": clean_string(raw_fields.get("CompanyClass")),
        "company_category": clean_string(raw_fields.get("CompanyCategory")),
        "incorporation_date": parse_date(
            raw_fields.get("CompanyRegistrationdate_date"), "mca_ogd"
        ),
        "roc": clean_string(raw_fields.get("CompanyROCcode")),
        "state": clean_string(raw_fields.get("CompanyStateCode")),
        "registered_address": clean_string(
            raw_fields.get("Registered_Office_Address")
        ),
        "authorised_capital": clean_numeric(raw_fields.get("AuthorizedCapital")),
        "paid_up_capital": clean_numeric(raw_fields.get("PaidupCapital")),
        "nic_code": clean_string(raw_fields.get("nic_code")),
    }


def normalize_mca_last30days(raw_fields: dict) -> dict:
    """
    Normalizes a raw record from the mca_last30days adapter.

    Three sheets, each with a different schema (from adapters/mca_last30days/README.md):

      Indian Companies  → CIN, Class, "Company Name", "Date Of Registration",
                          "Company Type", "Activity Code"
      LLP Companies     → LLPIN, "LLP Name", "Date of registration", Activity
      Foreign Companies → FCIN, "Company Name", "Date of Registration", Activity

    Fields absent from this source are left as None — never guessed.
    Capital fields (authorised_capital, paid_up_capital), roc, state,
    registered_address are always None from this source.
    """
    sheet = raw_fields.get("_sheet", "Indian Companies")

    cin = None
    name = None
    inc_date = None
    nic = None
    company_class = None
    company_category = None

    if sheet == "Indian Companies":
        cin = raw_fields.get("CIN")
        name = raw_fields.get("Company Name")
        inc_date = raw_fields.get("Date Of Registration")
        nic = raw_fields.get("Activity Code")
        company_class = raw_fields.get("Class")
        company_category = raw_fields.get("Company Type")
    elif sheet == "LLP Companies":
        cin = raw_fields.get("LLPIN")
        name = raw_fields.get("LLP Name")
        inc_date = raw_fields.get("Date of registration")
        nic = raw_fields.get("Activity")
    elif sheet == "Foreign Companies":
        cin = raw_fields.get("FCIN")
        name = raw_fields.get("Company Name")
        inc_date = raw_fields.get("Date of Registration")
        nic = raw_fields.get("Activity")
    # If _sheet has an unrecognised value, all fields stay None (safe default)

    return {
        "cin": clean_string(cin),
        "company_name": normalize_company_name(name),
        "company_status": None,        # not provided by this source
        "company_class": clean_string(company_class),
        "company_category": clean_string(company_category),
        "incorporation_date": parse_date(inc_date, "mca_last30days"),
        "roc": None,                   # not provided by this source
        "state": None,                 # not provided by this source
        "registered_address": None,    # not provided by this source
        "authorised_capital": None,    # not provided by this source
        "paid_up_capital": None,       # not provided by this source
        "nic_code": clean_string(nic),
    }


# ── Public entry point ────────────────────────────────────────────────────────

def normalize_record(raw_record: dict) -> dict:
    """
    Accepts a raw_entity_ingest record (as produced by adapters' to_ingest_records())
    and returns a cleaned dict matching the companies table columns.

    Expected input shape:
        {
            "source": "mca_ogd" | "mca_last30days",
            "raw_fields": { <source-specific field dict> }
        }

    Returns a dict with keys matching companies table columns. Missing or
    unparseable values are None, never omitted — callers should expect all keys.

    Raises ValueError for unknown source names so failures are loud, not silent.
    """
    source = raw_record.get("source")
    raw_fields = raw_record.get("raw_fields", {})

    if source == "mca_ogd":
        return normalize_mca_ogd(raw_fields)
    elif source == "mca_last30days":
        return normalize_mca_last30days(raw_fields)
    else:
        raise ValueError(
            f"normalize_record: unknown source '{source}'. "
            "Add a normalizer function for new sources rather than guessing."
        )
