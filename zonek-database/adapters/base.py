# adapters/base.py
# Owned by: every source adapter implements this interface.
# See: docs/04_PIPELINE_AND_AUTOMATION_SPEC.md

from abc import ABC, abstractmethod


class SourceAdapter(ABC):
    """
    Base interface that every data-source adapter must implement.
    One concrete subclass per source (e.g. MCAOGDAdapter, MCALast30DaysAdapter).
    """

    source_name: str  # e.g. "mca_ogd"

    @abstractmethod
    def fetch(self) -> str:
        """
        Download raw data from the source, write it unmodified to
        raw/<source_name>/<ISO-date>.<ext>, and return the file path.

        Contract:
        - Must raise on ANY failure — never return a partial or empty file.
        - Must be idempotent: if today's file already exists, return its path
          without re-fetching.
        - Writes a manifest JSON alongside the raw file (see role contract in
          docs/01_TEAM_ROLES_AND_OWNERSHIP.md).
        """

    @abstractmethod
    def to_ingest_records(self, raw_path: str) -> list[dict]:
        """
        Parse the raw file at raw_path into a list of raw_entity_ingest dicts.

        Output shape (see docs/02_DATA_SOURCE_SPECS.md):
            {
                "source": "<source_name>",
                "source_record_id": "<CIN or equivalent>",
                "fetched_at": "<ISO-8601 UTC datetime>",
                "raw_fields": { <exact fields as they appear in the source> }
            }

        No cleaning or normalization here — that belongs to the Pipeline role.
        Every field in raw_fields must be the verbatim string value from the source.
        """
