"""
pipeline/entity_resolution.py
------------------------------
Role: Pipeline/Normalization Engineer

CIN-based deterministic entity resolution — Phase 1 only.

Rules (from 01_TEAM_ROLES_AND_OWNERSHIP.md and 04_PIPELINE_AND_AUTOMATION_SPEC.md):
- Primary key is CIN (or LLPIN for LLPs). No fuzzy matching.
- Existence check only — insert vs. update decision is made here.
- Never create a company row with a NULL or empty CIN.
"""


def resolve_entity(cursor, cin: str) -> bool:
    """
    Check whether a CIN already exists in the companies table.

    Returns:
        True  → company exists, caller should update it
        False → company does not exist, caller should insert it

    Raises ValueError if cin is None or blank — callers must
    filter these out before calling this function.
    """
    if not cin or not str(cin).strip():
        raise ValueError(
            "resolve_entity: cin must be a non-empty string. "
            "Skip records with no CIN before calling resolve_entity."
        )

    cursor.execute(
        "SELECT cin FROM companies WHERE cin = %s",
        (cin,)
    )
    return cursor.fetchone() is not None


def upsert_company(cursor, cin: str, normalized: dict, is_new: bool) -> None:
    """
    Insert or update the companies table for a given CIN.

    For a new company (is_new=True): inserts a minimal row with just
    cin + company_name. The confidence layer (confidence.py) will fill
    in the remaining fields from field_provenance after scoring.

    For an existing company (is_new=False): does nothing here — the
    confidence layer decides which field values to write based on which
    source is most recent.

    company_name is required for a new insert (companies.company_name is NOT NULL).
    If missing, we use a sentinel value to avoid a crash, and log the anomaly.
    """
    if is_new:
        company_name = normalized.get("company_name") or "UNKNOWN (name missing at ingest)"
        cursor.execute(
            "INSERT INTO companies (cin, company_name) VALUES (%s, %s)",
            (cin, company_name),
        )
