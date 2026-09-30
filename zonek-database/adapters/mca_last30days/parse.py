# adapters/mca_last30days/parse.py
#
# Role: Data Acquisition Engineer
# Owned file: adapters/mca_last30days/parse.py
#
# Parses the MCA "Incorporated Or Closed During The Month" XLSX into
# raw_entity_ingest records. No cleaning, normalization, or type casting.
#
# The XLSX has three sheets with different schemas:
#   - Indian Companies  → CIN, Class, Company Name, Date Of Registration,
#                          Company Type, Activity Code
#   - LLP Companies     → LLPIN, LLP Name, Date of registration, Activity
#   - Foreign Companies → FCIN, Company Name, Date of Registration, Activity
#
# All three are emitted as raw_entity_ingest records. Each record includes
# raw_fields._sheet to identify which sheet it came from.
#
# Output shape (from docs/02_DATA_SOURCE_SPECS.md):
#   {
#       "source": "mca_last30days",
#       "source_record_id": "<CIN or LLPIN or FCIN>",
#       "fetched_at": "<ISO-8601 UTC>",
#       "raw_fields": { <verbatim row values as str, plus _sheet metadata> }
#   }

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

logger = logging.getLogger(__name__)

SOURCE_NAME = "mca_last30days"

# ── Sheet configuration ───────────────────────────────────────────────────────
# For each sheet: the column name that serves as the primary record identifier
# (CIN for Indian companies, LLPIN for LLPs, FCIN for foreign companies).

SHEET_ID_COLUMN: dict[str, str] = {
    "Indian Companies": "CIN",
    "LLP Companies": "LLPIN",
    "Foreign Companies": "FCIN",
}

# All sheets we know about. Any additional/renamed sheet is logged as a warning
# (schema drift) but still parsed using the same logic.
KNOWN_SHEETS = frozenset(SHEET_ID_COLUMN.keys())


def _find_header_row(rows: list[tuple], min_non_null: int = 3) -> int | None:
    """
    Find the index of the first row that has at least min_non_null non-None values.
    The MCA XLSX has a title row at row 0 and several blank rows before the header.
    Returns None if no suitable row is found.
    """
    for i, row in enumerate(rows):
        non_null = [v for v in row if v is not None]
        if len(non_null) >= min_non_null:
            return i
    return None


def _cell_to_str(value) -> str:
    """Convert an openpyxl cell value to a plain string, preserving empty as ''."""
    if value is None:
        return ""
    return str(value).strip()


def _load_fetched_at(raw_path: str) -> str:
    """
    Load fetched_at from sibling manifest JSON.
    Falls back to file mtime if no manifest exists.
    """
    p = Path(raw_path)
    # Manifest named <YYYY-MM>.manifest.json alongside <YYYY-MM>.xlsx
    manifest_path = p.parent / (p.stem + ".manifest.json")
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            fetched_at = manifest.get("fetched_at", "")
            if fetched_at:
                return fetched_at
        except Exception as exc:
            logger.warning("Could not read manifest at %s (%s) — using file mtime.", manifest_path, exc)
    mtime = p.stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()


def _parse_sheet(
    ws,
    sheet_name: str,
    fetched_at: str,
) -> list[dict]:
    """
    Parse a single openpyxl worksheet into raw_entity_ingest records.

    Parameters
    ----------
    ws : openpyxl.worksheet.worksheet.Worksheet
        The worksheet to parse.
    sheet_name : str
        Name of the sheet (used for _sheet metadata and ID column lookup).
    fetched_at : str
        ISO-8601 UTC timestamp to stamp on every record.

    Returns
    -------
    list[dict]
        raw_entity_ingest records for this sheet. Empty list if sheet is blank.
    """
    all_rows = list(ws.iter_rows(values_only=True))

    header_idx = _find_header_row(all_rows)
    if header_idx is None:
        logger.warning("Sheet %r: no header row found — skipping.", sheet_name)
        return []

    # Build clean column names from the header row
    raw_headers = all_rows[header_idx]
    fieldnames = [_cell_to_str(h) for h in raw_headers if h is not None]

    # Determine how many actual columns there are (ignore trailing None columns)
    n_cols = len([h for h in raw_headers if h is not None])

    # Determine the ID column for this sheet
    id_col = SHEET_ID_COLUMN.get(sheet_name)
    if id_col is None:
        # Unknown sheet — use first column as ID, log warning
        id_col = fieldnames[0] if fieldnames else "ID"
        logger.warning(
            "Sheet %r is not a known sheet — using first column %r as source_record_id. "
            "Known sheets: %s. Update SHEET_ID_COLUMN if the portal changed its sheet names.",
            sheet_name, id_col, sorted(KNOWN_SHEETS),
        )

    records: list[dict] = []
    data_rows = all_rows[header_idx + 1:]

    for row in data_rows:
        # Skip entirely blank rows
        non_null = [v for v in row[:n_cols] if v is not None]
        if not non_null:
            continue

        # Build raw_fields dict: verbatim string values keyed by column name
        raw_fields: dict[str, str] = {}
        for col_name, value in zip(fieldnames, row[:n_cols]):
            raw_fields[col_name] = _cell_to_str(value)

        # Add sheet-origin metadata so Pipeline knows which entity type this is
        raw_fields["_sheet"] = sheet_name

        source_record_id = raw_fields.get(id_col, "")

        records.append({
            "source": SOURCE_NAME,
            "source_record_id": source_record_id,
            "fetched_at": fetched_at,
            "raw_fields": raw_fields,
        })

    return records


def to_ingest_records(raw_path: str) -> list[dict]:
    """
    Parse the MCA last30days XLSX into a list of raw_entity_ingest dicts.

    Reads all three sheets (Indian Companies, LLP Companies, Foreign Companies),
    flattens them into a single list ordered: Indian → LLP → Foreign.

    Parameters
    ----------
    raw_path : str
        Path to the XLSX file produced by MCALast30DaysAdapter.fetch().

    Returns
    -------
    list[dict]
        One dict per entity row across all sheets.

    Raises
    ------
    FileNotFoundError
        If raw_path does not exist.
    ValueError
        If the file has no parseable sheets, or all sheets are empty.
    """
    path = Path(raw_path)
    if not path.exists():
        raise FileNotFoundError(f"Raw file not found: {raw_path}")

    fetched_at = _load_fetched_at(raw_path)

    try:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    except Exception as exc:
        raise ValueError(f"Cannot open XLSX file {raw_path}: {exc}") from exc

    actual_sheets = wb.sheetnames
    unknown = set(actual_sheets) - KNOWN_SHEETS
    if unknown:
        logger.warning(
            "Unexpected sheet(s) in XLSX: %s. These will be parsed with first-column as ID. "
            "Update SHEET_ID_COLUMN in parse.py if the portal has restructured its output.",
            sorted(unknown),
        )

    all_records: list[dict] = []

    for sheet_name in actual_sheets:
        ws = wb[sheet_name]
        sheet_records = _parse_sheet(ws, sheet_name, fetched_at)
        logger.info("Sheet %r: %d records parsed.", sheet_name, len(sheet_records))
        all_records.extend(sheet_records)

    wb.close()

    if not all_records:
        raise ValueError(
            f"Parsed 0 records from {raw_path} across all sheets. "
            f"Sheets found: {actual_sheets}. File may be malformed or all sheets are blank."
        )

    logger.info(
        "Total: %d raw_entity_ingest records from %s (%d sheets)",
        len(all_records), raw_path, len(actual_sheets),
    )
    return all_records
