"""
pipeline/run.py
----------------
Role: Pipeline/Normalization Engineer

Single entry point for one full ingest run for a given source:
  fetch → parse → insert raw → normalize → resolve → score → event → log

Usage (via GitHub Actions or manual):
    python -m pipeline.run --source mca_ogd
    python -m pipeline.run --source mca_last30days

Environment variables:
    DATABASE_URL   (required) — Postgres connection string
    TEST_LIMIT     (optional) — stop after N processed records (for manual smoke tests)

Exit codes:
    0 → success
    1 → error (exception logged + ingest_job marked 'failed')
"""

import argparse
import datetime
import json
import os
import sys

import psycopg2

from adapters.mca_ogd import MCAOGDAdapter
from adapters.mca_last30days import MCALast30DaysAdapter
from pipeline.normalize import normalize_record
from pipeline.entity_resolution import resolve_entity, upsert_company
from pipeline.confidence import process_field_provenance


def _get_adapter(source: str):
    if source == "mca_ogd":
        return MCAOGDAdapter()
    elif source == "mca_last30days":
        return MCALast30DaysAdapter()
    else:
        raise ValueError(f"Unknown source '{source}'. Must be 'mca_ogd' or 'mca_last30days'.")


def _raw_ingest_exists(cursor, source: str, raw_path: str) -> bool:
    """
    Idempotency guard: check whether we have already ingested this raw file.
    Matches on (source, raw_path) — same file path means same fetch run.
    """
    cursor.execute(
        "SELECT 1 FROM raw_ingest WHERE source = %s AND raw_path = %s LIMIT 1",
        (source, raw_path),
    )
    return cursor.fetchone() is not None


def run_pipeline(source: str) -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is required.", file=sys.stderr)
        sys.exit(1)

    test_limit = int(os.environ.get("TEST_LIMIT", "0"))  # 0 = no limit

    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    # Open an ingest job record immediately so failures are always logged
    started_at = datetime.datetime.now(datetime.timezone.utc)
    cursor.execute(
        """
        INSERT INTO ingest_jobs (source, started_at, status)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        (source, started_at, "running"),
    )
    job_id = cursor.fetchone()[0]
    conn.commit()

    try:
        adapter = _get_adapter(source)

        # ── Step 1: Fetch ────────────────────────────────────────────────────
        print(f"[{source}] Fetching raw data...")
        raw_path = adapter.fetch()
        print(f"[{source}] Raw file: {raw_path}")

        # ── Step 2: Parse ────────────────────────────────────────────────────
        records = adapter.to_ingest_records(raw_path)
        print(f"[{source}] Parsed {len(records)} records.")

        # ── Idempotency guard ────────────────────────────────────────────────
        if _raw_ingest_exists(cursor, source, raw_path):
            print(
                f"[{source}] Raw path '{raw_path}' already ingested. "
                "Skipping to avoid duplicates. "
                "Mark ingest_job as success."
            )
            cursor.execute(
                """
                UPDATE ingest_jobs
                SET finished_at = %s, status = %s, row_count = 0,
                    error_message = 'Skipped: already ingested this raw file'
                WHERE id = %s
                """,
                (datetime.datetime.now(datetime.timezone.utc), "success", job_id),
            )
            conn.commit()
            return

        fetched_at = started_at
        row_count = 0
        skip_count = 0

        for i, record in enumerate(records):
            raw_fields = record.get("raw_fields", {})

            # ── Step 3: Insert raw_ingest row ────────────────────────────────
            cursor.execute(
                """
                INSERT INTO raw_ingest
                    (source, source_record_id, fetched_at, raw_path, raw_fields)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (source, str(i), fetched_at, raw_path, json.dumps(raw_fields)),
            )
            raw_ingest_id = cursor.fetchone()[0]

            # ── Step 4: Normalize ────────────────────────────────────────────
            normalized = normalize_record(record)
            cin = normalized.get("cin")

            if not cin:
                skip_count += 1
                continue  # No CIN → cannot resolve → skip

            # ── Step 5: Resolve ──────────────────────────────────────────────
            exists = resolve_entity(cursor, cin)
            upsert_company(cursor, cin, normalized, is_new=not exists)

            # ── Step 6: Score (field_provenance + companies update) ──────────
            events = process_field_provenance(
                cursor=cursor,
                cin=cin,
                normalized_record=normalized,
                source=source,
                raw_ingest_id=raw_ingest_id,
                fetched_at=fetched_at,
            )

            # ── Step 7: Events ───────────────────────────────────────────────
            for event in events:
                cursor.execute(
                    """
                    INSERT INTO events
                        (cin, event_type, old_value, new_value, detected_at, source)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        event["cin"],
                        event["event_type"],
                        event.get("old_value"),
                        event["new_value"],
                        event["detected_at"],
                        event["source"],
                    ),
                )

            row_count += 1

            # Batch commit every 500 records to bound memory and transaction size
            if row_count % 500 == 0:
                conn.commit()
                print(f"[{source}] Processed {row_count} records...")

            # TEST_LIMIT: early stop for smoke tests against real DB
            if test_limit and row_count >= test_limit:
                print(f"[{source}] TEST_LIMIT={test_limit} reached. Stopping early.")
                break

        # ── Step 8: Job log success ──────────────────────────────────────────
        cursor.execute(
            """
            UPDATE ingest_jobs
            SET finished_at = %s, status = %s, row_count = %s
            WHERE id = %s
            """,
            (datetime.datetime.now(datetime.timezone.utc), "success", row_count, job_id),
        )
        conn.commit()
        print(
            f"[{source}] Pipeline complete. "
            f"{row_count} records written, {skip_count} skipped (no CIN)."
        )

    except Exception as exc:
        # Roll back any uncommitted work from the current batch
        conn.rollback()

        # Mark the job as failed — this must always succeed so monitoring can see it
        try:
            cursor.execute(
                """
                UPDATE ingest_jobs
                SET finished_at = %s, status = %s, error_message = %s
                WHERE id = %s
                """,
                (
                    datetime.datetime.now(datetime.timezone.utc),
                    "failed",
                    str(exc)[:2000],  # Truncate to fit column
                    job_id,
                ),
            )
            conn.commit()
        except Exception as log_exc:
            print(
                f"[{source}] CRITICAL: could not write failure to ingest_jobs: {log_exc}",
                file=sys.stderr,
            )

        print(f"[{source}] Pipeline failed: {exc}", file=sys.stderr)
        raise  # Re-raise so GitHub Actions sees a non-zero exit

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the Zonek ingest pipeline for a given source."
    )
    parser.add_argument(
        "--source",
        required=True,
        choices=["mca_ogd", "mca_last30days"],
        help="The source adapter to run.",
    )
    args = parser.parse_args()
    run_pipeline(args.source)
