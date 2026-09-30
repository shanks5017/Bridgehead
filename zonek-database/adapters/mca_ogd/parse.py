# adapters/mca_ogd/parse.py
#
# Role: Data Acquisition Engineer
# Owned file: adapters/mca_ogd/parse.py
#
# Parses a raw MCA OGD CSV file into raw_entity_ingest records.
# No cleaning, normalization, or type casting here — that belongs to the Pipeline role.
#
# Output shape (from docs/02_DATA_SOURCE_SPECS.md):
#   {
#       "source": "mca_ogd",
#       "source_record_id": "<CIN>",
#       "fetched_at": "<ISO-8601 UTC>",
#       "raw_fields": { <verbatim CSV row as dict of str -> str> }
#   }

import csv
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# The column that serves as the primary record identifier.
# CIN is the canonical entity key per docs/00_ARCHITECTURE_OVERVIEW.md.
# LLPs also appear in this dataset with LLPIN-format values in the same column.
SOURCE_ID_COLUMN = "CIN"

SOURCE_NAME = "mca_ogd"


def _load_fetched_at(raw_path: str) -> str:
    """
    Try to read fetched_at from the sibling .manifest.json file.
    Falls back to the file's modification time if no manifest exists.
    This keeps every record traceable to the exact fetch run.
    """
    manifest_path = Path(raw_path).with_suffix("").with_suffix("") \
        .parent / (Path(raw_path).stem + ".manifest.json")
    # handle both "<date>.csv" → "<date>.manifest.json"
    manifest_path = Path(raw_path).parent / (Path(raw_path).stem + ".manifest.json")

    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            fetched_at = manifest.get("fetched_at", "")
            if fetched_at:
                return fetched_at
        except Exception as exc:
            logger.warning("Could not read manifest at %s (%s) — falling back to file mtime.", manifest_path, exc)

    # Fallback: use file modification time as an approximation
    mtime = Path(raw_path).stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()


def to_ingest_records(raw_path: str) -> list[dict]:
    """
    Parse the raw MCA OGD CSV file into a list of raw_entity_ingest dicts.

    Parameters
    ----------
    raw_path : str
        Path to the raw CSV file produced by MCAOGDAdapter.fetch().

    Returns
    -------
    list[dict]
        One dict per company row. Shape:
        {
            "source": "mca_ogd",
            "source_record_id": "<CIN>",   # verbatim value from CIN column
            "fetched_at": "<ISO-8601 UTC>",
            "raw_fields": { <all 16 columns verbatim, str -> str> }
        }

    Raises
    ------
    FileNotFoundError
        If raw_path does not exist.
    ValueError
        If the CSV has no rows after the header, or the CIN column is absent.
    """
    path = Path(raw_path)
    if not path.exists():
        raise FileNotFoundError(f"Raw file not found: {raw_path}")

    fetched_at = _load_fetched_at(raw_path)
    records: list[dict] = []

    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)

        if reader.fieldnames is None:
            raise ValueError(f"CSV file is empty (no header row): {raw_path}")

        fieldnames = list(reader.fieldnames)
        if SOURCE_ID_COLUMN not in fieldnames:
            raise ValueError(
                f"Expected column '{SOURCE_ID_COLUMN}' not found in CSV. "
                f"Actual columns: {fieldnames}. "
                f"Schema may have drifted — check adapters/mca_ogd/README.md."
            )

        for row in reader:
            # raw_fields: verbatim dict of all columns as str -> str.
            # DictReader already gives us OrderedDict/dict with str values.
            # We convert to plain dict to keep the output serialisable.
            raw_fields: dict[str, str] = dict(row)

            records.append({
                "source": SOURCE_NAME,
                "source_record_id": raw_fields.get(SOURCE_ID_COLUMN, ""),
                "fetched_at": fetched_at,
                "raw_fields": raw_fields,
            })

    if not records:
        raise ValueError(f"CSV has a header but zero data rows: {raw_path}")

    logger.info("Parsed %d raw_entity_ingest records from %s", len(records), raw_path)
    return records
