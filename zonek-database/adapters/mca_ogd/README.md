# MCA OGD Adapter — Source Notes

**Role:** Data Acquisition Engineer  
**Adapter:** `mca_ogd`  
**Last verified against live source:** 2026-08-30

---

## Live source (verified 2026-08-30)

| Property | Value |
|---|---|
| Portal page | https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data |
| Dataset title (live) | **Registrars of Companies (RoC)-wise Company Master Data** |
| Publisher | Ministry of Corporate Affairs |
| Catalog | Company Master Data |
| Resource UUID | `4dbe5667-7b6b-41d7-82af-211562424d9a` |
| API base URL | `https://api.data.gov.in/resource/4dbe5667-7b6b-41d7-82af-211562424d9a` |
| File format | JSON (paginated API) → written to CSV |
| Total records (live) | **3,674,314** as of 2026-08-30 |
| Published | 2017-05-25 |
| Last updated | **2026-07-22** |
| License | GODL-India (Government Open Data Licence — India) |
| Attribution required | Yes — display "Source: MCA / data.gov.in" wherever this data appears |

### API authentication

**An API key IS required** for programmatic access. Set via environment variable:

```
DATA_GOV_API_KEY=<your key from data.gov.in>
```

Keys are obtainable free of charge by registering at https://data.gov.in (click
"Generate API Key" on the resource page). The portal's browser "Download" button
works without a key (session-based), but automated/headless access requires the
API key.

### Fetch strategy

The resource is served as a paginated JSON API (OAS 2.0). The adapter pages through
all records in batches of 10,000 (`offset` + `limit` params), accumulates them in
memory, and writes a single UTF-8 CSV to `raw/mca_ogd/<ISO-date>.csv`.

The API `total` field reported **3,674,314 records** on 2026-08-30. Expect a full
fetch to take several minutes depending on network speed (~368 pages at 10,000/page).

---

## Actual column names (verified against live API and sample CSV)

The API `field` metadata confirms these 16 columns (all keyword/string type):

| API / CSV column name | Notes |
|---|---|
| `CIN` | Company Identification Number (primary key). LLPs may have LLPIN-format values. |
| `CompanyName` | |
| `CompanyROCcode` | e.g. "ROC Bangalore", "ROC Delhi" |
| `CompanyCategory` | e.g. "Company limited by shares" — blank for LLPs |
| `CompanySubCategory` | e.g. "Non-government company" — blank for LLPs |
| `CompanyClass` | e.g. "Private", "Public", "One Person Company" — blank for LLPs |
| `AuthorizedCapital` | String, decimal e.g. "1000000.00" — blank for LLPs |
| `PaidupCapital` | String, decimal — blank for LLPs |
| `CompanyRegistrationdate_date` | ISO date string e.g. "2024-01-29" |
| `Registered_Office_Address` | Full address as single string |
| `Listingstatus` | "Listed" / "Unlisted" / blank |
| `CompanyStatus` | "Active" / "Strike Off" / "Dissolved" / etc. |
| `CompanyStateCode` | Lowercase state name e.g. "karnataka" |
| `CompanyIndian/Foreign Company` | "India" / "91" / blank — inconsistent; do not rely on format |
| `nic_code` | NIC 2008 5-digit code as string |
| `CompanyIndustrialClassification` | Human-readable NIC sector description |

**Note:** All columns arrive as strings. Numeric fields like `AuthorizedCapital` and
`PaidupCapital` are string-encoded decimals ("1000000.00") or blank (""). Casting is
the Pipeline/Normalization role's responsibility — not this adapter's.

---

## Spec vs reality differences

> Documented per task instructions. The adapter is coded against live reality.
> Differences are flagged here for the Pipeline/Normalization and Data Modeling engineers.

### 1. API key IS required (spec says "no auth required") ⚠️

`02_DATA_SOURCE_SPECS.md` states: *"no auth required for the OGD resource."*

**Reality:** The `api.data.gov.in` programmatic endpoint requires `?api-key=<key>`.
The portal's browser Download button does not require auth, but that is not automatable.
The API key approach IS freely available — register at data.gov.in. The adapter reads
the key from `DATA_GOV_API_KEY` env var and raises `ValueError` at startup if missing.

### 2. Dataset title differs (minor)

Spec calls it "MCA Company Master Data". Live title is "Registrars of Companies
(RoC)-wise Company Master Data". Same underlying dataset — no functional impact.

### 3. Exact column names differ from spec descriptions

The spec lists field names in natural English; the actual API uses these exact names:

| Spec description | Actual column name |
|---|---|
| company name | `CompanyName` |
| company status | `CompanyStatus` |
| company class | `CompanyClass` |
| company category | `CompanyCategory` |
| sub-category | `CompanySubCategory` |
| authorised capital | `AuthorizedCapital` (American spelling, string) |
| paid-up capital | `PaidupCapital` (string) |
| registration date | `CompanyRegistrationdate_date` |
| registered state | `CompanyStateCode` (lowercase, e.g. "karnataka") |
| ROC | `CompanyROCcode` |
| NIC code | `nic_code` |
| registered office address | `Registered_Office_Address` |

### 4. Three extra columns not listed in spec

- `Listingstatus` — Listed / Unlisted / blank
- `CompanyIndian/Foreign Company` — "India" / "91" / blank; inconsistent values
- `CompanyIndustrialClassification` — text NIC sector description

All are preserved verbatim in `raw_fields`. Pipeline may map or ignore during normalization.

### 5. LLP records have blank financial/category fields

LLP-type entities have blank `AuthorizedCapital`, `PaidupCapital`, `CompanyCategory`,
`CompanySubCategory`, and `CompanyClass`. Both CIN (companies) and LLPIN (LLPs) are
present in the same resource — distinguishable by CIN format. Spec mentions CIN/LLPIN
as the primary key, which is correct.

### 6. Data freshness lag confirmed

Last updated 2026-07-22. Per spec intent: use as historical backfill base only.

---

## Cadence

- **Fetch frequency:** monthly (per spec)
- **Idempotency:** if `raw/mca_ogd/<today>.csv` already exists, adapter skips the fetch

---

## GODL Attribution statement (required wherever data is displayed)

> Data sourced from the Ministry of Corporate Affairs via the Open Government Data
> (OGD) Platform India (data.gov.in) under the Government Open Data Licence –
> India (GODL-India).
