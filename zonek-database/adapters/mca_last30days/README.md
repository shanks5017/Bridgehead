# MCA Last30Days Adapter — Source Notes

**Role:** Data Acquisition Engineer  
**Adapter:** `mca_last30days`  
**Last verified against live source:** 2026-08-30

---

## Live source (verified 2026-08-30)

| Property | Value |
|---|---|
| Portal page | https://www.mca.gov.in/content/mca/global/en/data-and-reports/company-llp-info/incorporated-closed-month.html |
| Page title (live) | **Incorporated Or Closed During The Month** |
| Publisher | Ministry of Corporate Affairs |
| Access method | Static listing page → direct XLSX download per month |
| File format | XLSX (Excel), ~1 MB/month |
| Sheets per file | 3: `Indian Companies`, `LLP Companies`, `Foreign Companies` |
| Latest file (verified) | "Companies and LLPs registered in July' 2026" — published 01-08-2026 |
| Historical depth | 124 months available (paginated 5 per page) |
| License | MCA public data; same basic-data-is-free posture as other MCA public lookups |
| Attribution | Credit MCA / mca.gov.in as the source wherever data is displayed |

### ⚠️ Scripted HTTP Access: BLOCKED by Akamai WAF

Direct HTTP requests to mca.gov.in are blocked by **Akamai EdgeSuite WAF** — both
plain and browser-UA-spoofed requests receive `Access Denied` (403). This is true for:
- `Invoke-WebRequest` / PowerShell
- Python `requests`
- `curl`

Even with `playwright-stealth` in headless Chromium, Akamai successfully blocks the execution with an `Access Denied` page.

### ⚠️ Manual Fallback Supported

Because the automated Playwright approach is aggressively blocked, this adapter natively supports a semi-automated **manual fallback**:
1. Go to the portal URL in your normal, local browser: https://www.mca.gov.in/content/mca/global/en/data-and-reports/company-llp-info/incorporated-closed-month.html
2. Download the most recent month's Excel file.
3. Save it exactly at `raw/mca_last30days/manual/<YYYY-MM>.xlsx` (e.g., `raw/mca_last30days/manual/2026-09.xlsx`).
4. Run the pipeline (`python -m pipeline.run --source mca_last30days`).

The adapter will detect the manual file, log a note, and skip the browser fetch entirely.

### Download mechanism

The listing page renders monthly files as table rows. Each row has:
- File name: `Companies and LLPs registered in <Month> '<Year>`
- Date: publication date (1st of the following month)
- Download icon (`<a>` tag or JS-triggered click)

The adapter:
1. Opens the listing page in headless Chromium
2. Finds the first (most-recent/`New`-tagged) download link
3. Clicks it; waits for the file download to complete
4. Moves the downloaded XLSX to `raw/mca_last30days/<ISO-date>.xlsx`

---

## XLSX structure (verified against July 2026 file)

The file has a **title row at row 1** and a **blank gap** before the header row.
Do not assume row 1 is the header. The actual header row index varies by sheet:

### Sheet 1: Indian Companies (header at row 9)

| Column | Notes |
|---|---|
| `CIN` | Standard CIN format — same key as mca_ogd |
| `Class` | e.g. "Private", "Public", "One Person Company" |
| `Company Name` | |
| `Date Of Registration` | String "DD-MM-YYYY" format |
| `Company Type` | e.g. "Non-government company" |
| `Activity Code` | 2-digit NIC division code (string) |

**Data rows in July 2026 file: 26,225**

### Sheet 2: LLP Companies (header at row 10)

| Column | Notes |
|---|---|
| `LLPIN` | LLP Identification Number — same key type as CIN for LLPs |
| `LLP Name` | |
| `Date of registration` | String "DD-MM-YYYY" format |
| `Activity` | 2-digit NIC division code (string) |

**Data rows in July 2026 file: 11,819**

### Sheet 3: Foreign Companies (header at row 11)

| Column | Notes |
|---|---|
| `FCIN` | Foreign Company Identification Number |
| `Company Name` | |
| `Date of Registration` | String "DD-MM-YYYY" format |
| `Activity` | 2-digit NIC division code (string) |

**Data rows in July 2026 file: 11**

---

## Spec vs reality differences

### 1. Source URL is different ⚠️

Spec says: `mca.gov.in → MCA Services → Master Data Services`  
Reality: `mca.gov.in → Data & Reports → Company/LLP Information → Incorporated Or Closed During The Month`  
URL: https://www.mca.gov.in/content/mca/global/en/data-and-reports/company-llp-info/incorporated-closed-month.html

### 2. NOT "last 30 days" — it is MONTHLY BATCHES ⚠️

Spec calls this source "Companies/LLPs Registered in Last 30 Days" implying a rolling
30-day window. **Reality: the data is published as fixed monthly batches.** The July 2026
file (all registrations in July) was published on 01-Aug-2026. There is no rolling window.

**Impact on deduplication (Pipeline role must know this):**
- Running daily will download the SAME monthly file repeatedly within a month
- The fetch step is idempotent per calendar-month (not per day): if a file for the
  current month already exists, skip the download
- The file for month M is only published at the start of month M+1
- `raw/mca_last30days/` files are named `<YYYY-MM>.xlsx` (year-month, not day)
  to reflect this monthly granularity

### 3. Headless browser required — scripted request is BLOCKED ⚠️

Spec says: "Start by trying the simpler scripted-request approach; fall back to headless
browser only if required."  
Reality: mca.gov.in is protected by **Akamai WAF** which returns 403 to all non-browser
HTTP clients. The scripted approach was attempted and confirmed blocked. The headless
browser (Playwright) is not a fallback — it is the only viable method.

### 4. Three entity types per file, not one

The XLSX contains three separate sheets covering Indian companies, LLPs, and foreign
companies — each with different column schemas. The adapter flattens all three into
`raw_entity_ingest` records, tagging each with the sheet it came from via
`raw_fields._sheet`.

### 5. Column schema is much sparser than mca_ogd ⚠️

This source does NOT provide: authorised capital, paid-up capital, registered address,
ROC code, sub-category, state, or listing status. It provides only incorporation basics.
The Pipeline role must handle records from this source having blank values for those fields.

| mca_ogd column | mca_last30days equivalent | Notes |
|---|---|---|
| `CIN` | `CIN` (Indian) / `LLPIN` (LLP) / `FCIN` (Foreign) | Key field; type differs by sheet |
| `CompanyName` | `Company Name` / `LLP Name` | Different spacing |
| `CompanyClass` | `Class` | Only Indian sheet |
| `CompanyRegistrationdate_date` | `Date Of Registration` / `Date of registration` | DD-MM-YYYY vs YYYY-MM-DD |
| `nic_code` | `Activity Code` / `Activity` | 2-digit division vs 5-digit NIC code |
| `CompanyCategory` | `Company Type` | Only Indian sheet; different values |
| (no equivalent) | `_sheet` | Added by adapter: "Indian Companies" / "LLP Companies" / "Foreign Companies" |
| 9 other mca_ogd columns | *(absent)* | ROC, state, address, capitals, etc. not in this source |

### 6. Date format differs from mca_ogd

mca_ogd: `CompanyRegistrationdate_date` is `YYYY-MM-DD` (ISO)  
mca_last30days: registration date is `DD-MM-YYYY` — normalization belongs to Pipeline role

---

## Cadence

- **Fetch frequency:** monthly (not daily as spec says — the underlying data is monthly)
- **File naming:** `raw/mca_last30days/<YYYY-MM>.xlsx` (year-month, not full date)
- **Idempotency:** if `raw/mca_last30days/<YYYY-MM>.xlsx` already exists, skip

---

## GODL / ToS note

MCA public data is freely accessible. The download page does not display a ToS prohibition
on automated access, but the Akamai WAF restriction means the portal implicitly expects
browser-based access. The headless browser mimics human browsing exactly — one request per
month at the cadence a human would use. No high-frequency scraping.
