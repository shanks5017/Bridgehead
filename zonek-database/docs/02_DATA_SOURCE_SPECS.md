# Data Source Specs

Build Phase 1 sources only. Phase 2 sources are documented here so the team knows they exist
and roughly what they'll require, but **do not build adapters for them yet** — each one has an
open legal/access question that needs resolving before an adapter is written (see the "Access
notes" line on each).

---

## PHASE 1 — build these first

### Source: MCA Company Master Data (data.gov.in OGD)

- **Portal:** data.gov.in, "Company Master Data" catalog, published by the Ministry of
  Corporate Affairs
- **Access method:** bulk file download (CSV), no auth required for the OGD resource
- **License:** GODL-India — permits commercial and non-commercial reuse with attribution.
  Attribution requirement: publish an attribution statement crediting MCA/data.gov.in as the
  source wherever this data is displayed.
- **Fields:** CIN, company name, company status, company class, company category,
  authorised capital, paid-up capital, registration date, registered state, ROC, principal
  business activity (NIC code), registered office address, sub-category
- **Freshness:** historically has lagged (verify current freshness before relying on it for
  "new today" — it is a bulk historical dataset, not a live feed). Use this as the **backfill /
  historical base**, not the daily-new-company signal.
- **Cadence:** fetch monthly (check for updates; re-fetch if the catalog shows a newer resource)
- **Output contract:** `raw_entity_ingest` records, one per company row, tagged
  `source: "mca_ogd"`

### Source: MCA "Companies/LLPs Registered in Last 30 Days"

- **Portal:** mca.gov.in → MCA Services → Master Data Services
- **Access method:** the portal generates a downloadable Excel report on request. This is a
  **form-driven download, not a JSON API** — confirm at build time whether it can be triggered
  headlessly (a scripted POST request) or requires a headless browser. Start by trying the
  simpler scripted-request approach; fall back to headless browser only if required.
- **License/access notes:** this is official MCA master data made available through the
  portal's own facility — same basic-data-is-free posture as MCA's other public lookups.
  Confirm current ToS on the page before automating; do not scrape faster than a human clicking
  through the form would.
- **Fields:** same core fields as OGD (CIN, name, status, incorporation date, ROC, state) —
  this is the **daily/rolling freshness signal**, complementing the OGD bulk backfill.
- **Cadence:** daily
- **Output contract:** same `raw_entity_ingest` shape, tagged `source: "mca_last30days"`

---

## PHASE 2 — documented, not built yet

### GST Search Taxpayer (gst.gov.in)

- **What it gives:** GSTIN, legal name, trade name, registration status — a legitimacy
  cross-check against MCA records
- **Access notes (open question, resolve before building):** public manual search exists;
  **programmatic/bulk access requires GSP (GST Suvidha Provider) authorization** — this is not
  an open API. Do not scrape the public search page at volume for a commercial product without
  a legal review; this is a materially different risk posture from the GODL-licensed MCA data.

### Udyam Registration (udyamregistration.gov.in)

- **What it gives:** MSME classification, registration date, NIC codes
- **Access notes:** public per-entity verification exists; **bulk/discovery search (e.g. "list
  all Udyam MSMEs in a given city") is not confirmed to be openly available** — treat as
  research task before building.

### FSSAI / DPIIT / DGFT / EPFO / IP India

- **What they give:** category-specific legitimacy signals (food licensing, startup
  recognition, import/export, employer registration, trademarks)
- **Access notes:** all are per-entity public search pages, none confirmed to have open bulk
  APIs. Build only the ones that match an actual target customer segment — do not build all of
  these speculatively.

---

## Output contract (all sources, Phase 1 and later)

Every adapter, regardless of source, must produce records in this shape before handing off to
the Pipeline role:

```json
{
  "source": "mca_ogd",
  "source_record_id": "raw row identifier or CIN",
  "fetched_at": "2026-08-30T08:00:00Z",
  "raw_fields": { "...": "exact fields as they appeared in the source, unmodified" }
}
```

Normalization happens downstream, in the Pipeline role — never inside an adapter.
