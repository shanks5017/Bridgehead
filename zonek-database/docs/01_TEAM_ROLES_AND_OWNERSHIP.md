# Team Roles & Ownership

This document exists so a coding agent (or a human) can be told **"act as Role X"** and know
exactly which files it owns, what it's allowed to change, and what its input/output contract
with the other roles is. Treat each role as a separate context — don't let "Acquisition
Engineer" work start editing schema files owned by "Data Modeling Engineer."

---

## Role: Data Acquisition Engineer

**Owns:** `adapters/`

**Responsibility:** Fetch raw data from one external source and write it to `raw/<source>/`
unmodified. Nothing else. No parsing logic beyond what's needed to download the file
(e.g. handling MCA's download form/session if required).

**Must not:** normalize fields, resolve entities, write to the canonical database directly,
or make decisions about data quality. If a fetch fails, log it and exit non-zero — do not
silently skip.

**Contract (output):** every adapter run produces exactly one immutable file per run at
`raw/<source_name>/<ISO-date>.{csv,xlsx,json}`, plus a manifest row:
```json
{
  "source": "mca_ogd",
  "fetched_at": "2026-08-30T08:00:00Z",
  "raw_path": "raw/mca_ogd/2026-08-30.csv",
  "row_count": 184213,
  "status": "success"
}
```

**Reads:** `02_DATA_SOURCE_SPECS.md` for the exact source details.

---

## Role: Data Modeling Engineer

**Owns:** `db/schema.sql`, `db/migrations/`

**Responsibility:** Define and evolve the canonical Postgres schema. Every table change is a
migration file, never a direct schema edit in production.

**Must not:** write ingestion or pipeline logic. This role only owns structure, not data flow.

**Reads:** `03_DATABASE_SCHEMA.md` — this is the source of truth for what the schema should
look like at each phase. If a pipeline engineer needs a new field, they request it here first.

---

## Role: Pipeline/Normalization Engineer

**Owns:** `pipeline/normalize.py`, `pipeline/entity_resolution.py`, `pipeline/confidence.py`

**Responsibility:** Read a raw staged file, clean/standardize fields (company name casing,
address parsing, date formats), resolve entities against the existing canonical store using
CIN/LLPIN as the hard key, and write `field_provenance` rows with a source, timestamp, and
confidence score for every field touched.

**Must not:** fetch data from external sources (that's Acquisition's job) or change the schema
(that's Data Modeling's job). If a field it needs doesn't exist yet, it requests a migration.

**Hard rule:** entity resolution below is deterministic-only for Phase 1 — CIN/LLPIN exact
match. No fuzzy name matching, no LLM matching, until Phase 1 is stable and this rule is
explicitly revisited.

**Reads:** `04_PIPELINE_AND_AUTOMATION_SPEC.md` for the exact adapter → normalize → store
contract.

---

## Role: Platform/Automation Engineer

**Owns:** `.github/workflows/`

**Responsibility:** Wire up scheduled GitHub Actions that run: Acquisition adapter → Pipeline
normalization → DB load, in that order, with failure alerting (a failed step must not silently
proceed to the next step). One workflow file per source at Phase 1.

**Must not:** write business logic. This role only orchestrates existing scripts on a schedule.

**Reads:** `04_PIPELINE_AND_AUTOMATION_SPEC.md` for the workflow spec and cadence per source.

---

## Role: API Engineer

**Owns:** `api/`

**Responsibility:** Expose read-only FastAPI endpoints over the canonical store. Every response
that includes a business field must include its provenance (source, confidence, last_verified)
alongside it — this is not optional, it's the product's core differentiator.

**Must not:** write to the database. Read-only at Phase 1. No auth/write endpoints until the
core read path is proven.

---

## Working rule for whoever runs the coding agent

When handing a task to the agent, prefix it with the role, e.g.:

> "Acting as the Data Acquisition Engineer, implement the `mca_ogd` adapter per
> `02_DATA_SOURCE_SPECS.md`. Only touch files under `adapters/mca_ogd/`."

This keeps each agent session scoped to one contract and prevents cross-role scope creep,
which is the most common way small teams (and agents) end up with a tangled first version.
