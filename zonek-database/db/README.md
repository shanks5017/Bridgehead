# Database Setup & Migrations

**Role:** Data Modeling Engineer  
**Status:** Phase 1 tables implemented

## Phase 1 Schema

The schema covers the core requirements for Phase 1 (Data Acquisition and API). The primary tables are:
- `companies`
- `raw_ingest`
- `field_provenance`
- `events`
- `ingest_jobs`

### Applying Migrations Locally

Currently, migrations are managed as plain `.sql` files in the `migrations/` directory.

To apply the schema locally against your PostgreSQL instance (assuming you have `psql` installed and a `DATABASE_URL` environment variable or connection parameters ready):

```bash
psql -d <your_database_name> -U <your_username> -f migrations/001_initial_schema.sql
```

*Note: In future phases, we will introduce a migration framework (e.g. Alembic, Flyway, or similar). For now, executing the SQL files directly is sufficient.*

### Sparser Field Sets & Nullability

The `mca_ogd` adapter provides a rich set of 16 columns per company. However, the `mca_last30days` adapter provides a much sparser field set (only 6-7 columns, e.g. CIN, Class, Company Name, Registration Date, Activity Code).

Because of this disparity, the following columns in the `companies` table **MUST BE NULLABLE**, as the `mca_last30days` adapter will not have data for them when a new company is first registered:
- `company_status`
- `company_class`
- `company_category`
- `roc`
- `state`
- `registered_address`
- `authorised_capital`
- `paid_up_capital`
- `nic_code` (Present in some sheets but named "Activity Code" or "Activity")

The Pipeline role (next up) will map fields into this schema and rely on the `field_provenance` table and JSONB `raw_fields` column to accurately reflect where the data originated.
