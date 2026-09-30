"""
pipeline/confidence.py
-----------------------
Role: Pipeline/Normalization Engineer

Writes field_provenance rows and updates companies with the current
best value per field, following the rules in 03_DATABASE_SCHEMA.md
and 04_PIPELINE_AND_AUTOMATION_SPEC.md.

Key rules:
  - Confidence score = 80 for both Phase 1 sources (per 03_DATABASE_SCHEMA.md).
  - If two sources disagree on a field, BOTH provenance rows are kept.
    The companies table is updated to whichever source has the more recent
    last_verified_at — the disagreement is preserved in field_provenance,
    never silently discarded.
  - Skip None values — only write provenance for fields that actually
    have a value in the normalized record.
  - All field_value entries are stored as TEXT in field_provenance
    (Postgres stores typed values in companies; provenance is audit trail).
"""

import datetime


# Phase 1 confidence score for all sources (see 03_DATABASE_SCHEMA.md)
CONFIDENCE_SCORE = 80

# Fields that can be written from normalized records to companies.
# Excludes 'cin' (it's the PK, not a field to score) and 'created_at'/'updated_at'.
SCOREABLE_FIELDS = {
    "company_name",
    "company_status",
    "company_class",
    "company_category",
    "incorporation_date",
    "roc",
    "state",
    "registered_address",
    "authorised_capital",
    "paid_up_capital",
    "nic_code",
}

# Fields that require numeric casting when writing to companies table
NUMERIC_FIELDS = {"authorised_capital", "paid_up_capital"}

# Fields that require DATE casting when writing to companies table
DATE_FIELDS = {"incorporation_date"}


def _get_best_values_per_field(cursor, cin: str) -> dict:
    """
    Query field_provenance for all rows for this CIN and return the
    current "best" (most recently verified) value per field name.

    Returns dict of {field_name: {"value": str, "last_verified_at": datetime}}.
    """
    cursor.execute(
        """
        SELECT field_name, field_value, source, confidence_score, last_verified_at
        FROM field_provenance
        WHERE cin = %s
        """,
        (cin,),
    )
    rows = cursor.fetchall()

    best: dict = {}
    for field_name, field_value, source, conf_score, last_ver in rows:
        if field_name not in best:
            best[field_name] = {"value": field_value, "last_verified_at": last_ver}
        else:
            if last_ver > best[field_name]["last_verified_at"]:
                best[field_name] = {"value": field_value, "last_verified_at": last_ver}

    return best


def _get_current_field_values_for_source(cursor, cin: str, source: str) -> dict:
    """
    Return the existing field_provenance rows for this specific CIN+source pair.
    Used to detect whether a field's value has changed since last ingest.
    """
    cursor.execute(
        """
        SELECT field_name, field_value
        FROM field_provenance
        WHERE cin = %s AND source = %s
        """,
        (cin, source),
    )
    return {row[0]: row[1] for row in cursor.fetchall()}


def process_field_provenance(
    cursor,
    cin: str,
    normalized_record: dict,
    source: str,
    raw_ingest_id: int,
    fetched_at: datetime.datetime,
) -> list[dict]:
    """
    For each field in normalized_record:
      1. Write (or update) a field_provenance row for this CIN+field+source.
      2. Re-evaluate which source has the freshest value for that field.
      3. Update the companies table with the winning value.
      4. Log an event if the effective value changed.

    Returns a list of event dicts for the caller to INSERT into the events table.
    Each event dict has: cin, event_type, old_value, new_value, source, detected_at.

    Idempotency: re-running for the same source+CIN upserts the provenance row
    (updates field_value and last_verified_at) — no duplicates.
    """
    events: list[dict] = []

    # Snapshot effective values BEFORE this run (for change detection)
    old_best = _get_best_values_per_field(cursor, cin)

    # Get existing provenance from THIS source for this CIN
    existing_for_source = _get_current_field_values_for_source(cursor, cin, source)

    # --- Upsert field_provenance rows ---
    for field_name, new_value in normalized_record.items():
        if field_name == "cin":
            continue
        if field_name not in SCOREABLE_FIELDS:
            continue
        if new_value is None:
            continue

        new_value_str = str(new_value)

        # Only upsert if value has changed for this source (avoids unnecessary writes
        # and also keeps last_verified_at meaningful as "when we last saw this value")
        existing_val = existing_for_source.get(field_name)
        if existing_val == new_value_str:
            # Same value from same source — still update last_verified_at to signal freshness
            cursor.execute(
                """
                UPDATE field_provenance
                SET last_verified_at = %s, raw_ingest_id = %s
                WHERE cin = %s AND field_name = %s AND source = %s
                """,
                (fetched_at, raw_ingest_id, cin, field_name, source),
            )
        else:
            # New value or first time seeing this field from this source
            cursor.execute(
                """
                INSERT INTO field_provenance
                    (cin, field_name, field_value, source, raw_ingest_id,
                     confidence_score, last_verified_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (cin, field_name, source)
                DO UPDATE SET
                    field_value      = EXCLUDED.field_value,
                    raw_ingest_id    = EXCLUDED.raw_ingest_id,
                    confidence_score = EXCLUDED.confidence_score,
                    last_verified_at = EXCLUDED.last_verified_at
                """,
                (cin, field_name, new_value_str, source, raw_ingest_id,
                 CONFIDENCE_SCORE, fetched_at),
            )

    # --- Re-read best values AFTER upserts ---
    new_best = _get_best_values_per_field(cursor, cin)

    # --- Update companies table with changed fields ---
    changed_fields: dict = {}
    for field_name, info in new_best.items():
        old_info = old_best.get(field_name)
        old_val = old_info["value"] if old_info else None
        new_val = info["value"]

        if old_val != new_val:
            changed_fields[field_name] = (old_val, new_val)

    if changed_fields:
        set_clauses: list[str] = []
        set_values: list = []

        for field_name, (_, new_val) in changed_fields.items():
            set_clauses.append(f"{field_name} = %s")

            # Cast to appropriate Python type before sending to Postgres
            if field_name in NUMERIC_FIELDS:
                try:
                    set_values.append(float(new_val))
                except (ValueError, TypeError):
                    set_values.append(None)
            else:
                set_values.append(new_val)

        set_values.append(fetched_at)   # updated_at
        set_values.append(cin)          # WHERE clause

        cursor.execute(
            f"UPDATE companies SET {', '.join(set_clauses)}, updated_at = %s WHERE cin = %s",
            tuple(set_values),
        )

        # --- Emit events for changed fields ---
        # Determine whether this is the first-ever write (new_registration) or an update
        is_first_write = not old_best  # old_best was empty before this run

        for field_name, (old_val, new_val) in changed_fields.items():
            event_type = "new_registration" if is_first_write else "field_change"
            events.append(
                {
                    "cin": cin,
                    "event_type": event_type,
                    "old_value": old_val,
                    "new_value": new_val,
                    "source": source,
                    "detected_at": fetched_at,
                }
            )

    return events
