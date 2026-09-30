# Phase 2 Source Research — Findings

This resolves the open "UNKNOWN" items from the original source research, checked against
current (Aug 2026) live information. Read this before planning any Phase 2 adapter work.

---

## ⚠️ URGENT — fix this in Phase 1 before it becomes a production problem

**The `mca_ogd` adapter is currently using a public demo API key, not a real one.**

The key in the current code (`579b464db66ec23bdd00000177271dbdcfbd4c9e77a7347d55b709c9`)
matches the exact pattern of the **sample key data.gov.in publishes in its own documentation
for demonstration purposes** — the same shared key appears verbatim in multiple third-party
tutorials and libraries. It is not a key issued to Zonek.

**Why this matters:** shared demo keys carry much lower rate limits than a personal key, and
since it's used by an unknown number of other people/tutorials worldwide, it is likely to
throttle or fail unpredictably — especially during a 368-page paginated fetch of 3.67M records.
This can silently degrade Phase 1's reliability without an obvious error message pointing to
the real cause.

**Fix:** register a free personal API key at data.gov.in ("Generate API Key" on any resource
page, requires just an account) and set `DATA_GOV_API_KEY` to that value instead. This is a
five-minute fix — do it before Phase 1 is considered production-stable, not after.

---

## GST — resolved: usable, but not via a government API we can call ourselves

- **Confirmed:** GSTN does not offer an open public API for arbitrary GSTIN lookups. Bulk
  programmatic access is gated through **GSP (GST Suvidha Provider) status**, which is an
  onboarding/compliance relationship, not a self-serve API key — this matches what the earlier
  research found, no change there.
- **New finding:** several third-party resellers (Deepvue, WhiteBooks, gstinapi.in, and others)
  already hold GSP authorization and resell **single-GSTIN verification** as a simple REST API
  — pay-per-call, no need for Zonek to become a GSP itself. This is the realistic Phase 2 path:
  buy verification-as-a-service for GSTINs we already have from other sources, rather than
  trying to discover new businesses through GST.
- **Practical implication for the roadmap:** GST becomes a **verification/enrichment step for
  companies already in our database from MCA**, not a discovery source. Cheap at low volume
  (some resellers offer free tiers for the first ~100 lookups), cost scales with database size.
- **Still open:** exact per-call pricing and reliability across resellers needs a short
  comparison pass before picking one — a 30-minute task when GST work actually starts, not
  something to resolve now.

---

## Udyam — ⚠️ CORRECTED: aggregate totals only, not a discovery source

> **Correction applied from `docs/08_VALIDATED_RESEARCH.md` (September 2026 independent verification).**
> The findings below supersede the original claim that Udyam was an entity-level dataset.

- **Original claim (WRONG):** data.gov.in was said to host a daily-updated, entity-level
  MSME registry with company names, addresses, and registration details.
- **Reality (independently verified):** The live Udyam dataset on data.gov.in is titled
  **"District Wise Total MSME Registered Enterprises under UDYAM Registration till last date"**.
  It is a **summary/aggregate table** — district-level totals only. It contains no individual
  company names, CINs, or addresses. It cannot be used to discover specific businesses.
- **Implication for Phase 2 priority:** Udyam is not a discovery source. It is an aggregate
  statistics table useful only for market-trend reporting (e.g. "how many MSMEs are registered
  in Maharashtra"), which is a much narrower use case than assumed. This is the same situation
  as DPIIT — confirmed aggregate only.
- **Recommendation:** move Udyam to the same tier as DPIIT — useful for aggregate reporting,
  not for pipeline entity ingestion. **GST verification (via reseller API) is now the #1
  Phase 2 priority** as it enriches/verifies real company records already in the database.

---

## FSSAI — resolved: no change, stays Phase 3+

- **Confirmed:** no bulk/open dataset exists. The FoSCoS portal uses AES-encrypted
  request/response payloads with CSRF tokens — third-party tools that verify FSSAI licenses
  do so via a genuinely involved reverse-engineered encryption scheme, not a simple scrape.
- **Implication:** this is meaningfully harder to build than any Phase 1/early-Phase-2 source,
  and there's no GODL-style legal footing for it. Correctly placed as "later" — only build
  this if a real customer segment (food businesses specifically) justifies the engineering and
  legal cost.

---

## DPIIT / Startup India — resolved: aggregate only, not a discovery source

- **Confirmed:** the data.gov.in DPIIT datasets are **counts by year/state/industry**, not
  entity-level records (no individual startup names, CINs, or addresses in the open dataset).
- **Implication:** this cannot be used to discover which specific companies are
  DPIIT-recognized — it's only useful for aggregate market-trend statistics (e.g. "how many
  startups were recognized in Maharashtra this year"), which is a much narrower use case than
  originally assumed. Per-entity DPIIT recognition would still require the
  startupindia.gov.in certificate-validation page, one lookup at a time.
- **Recommendation:** deprioritize below where it was — this is a "nice aggregate stat for a
  report," not a business-discovery pipeline.

---

## Commercial rentals — resolved: no free/government source exists, confirmed

- **Confirmed:** no Indian government body publishes commercial rental data. Every available
  option is a private portal (99acres, MagicBricks, Housing.com, NoBroker) with no public API
  — all "access" in the market today is third-party scraping services, which is exactly the
  legal-risk pattern flagged earlier (ToS-governed, not GODL-licensed, meaningfully different
  risk profile from MCA/Udyam data).
- **No new information changes the earlier recommendation:** manually-seeded rent ranges per
  locality for the MVP, or a paid data vendor if budget allows later. Do not build a scraper
  against these portals as a Phase 1/2 priority — it's the highest-legal-risk, least-supported
  source in the entire stack, for a feature that isn't part of the core verified-business
  product anyway.

---

## Revised Phase 2+ build order (supersedes the original priority table)

> ⚠️ **Table updated September 2026** based on independent verification in `docs/08_VALIDATED_RESEARCH.md`.
> Udyam and DPIIT are both confirmed aggregate-only — neither is a discovery source.

| Order | Source | Why this position now |
|---|---|---|
| 1 | **GST verification (via reseller API)** | Cheap, fast to integrate; enriches/verifies entities already in our database with GSTIN. Deepvue, WhiteBooks, gstincheck.co.in all offer pay-per-call APIs at ₹0.60–₹2 per lookup. |
| 2 | **Udyam (aggregate stats only)** | Confirmed aggregate district-level totals — NOT entity-level. Useful only for market-trend reporting, not for finding specific companies. Build only if aggregate stats are a requested feature. |
| 3 | **DPIIT (aggregate stats only)** | Useful for reporting, not for finding new entities — low build effort, low priority |
| Later, situational | FSSAI, DGFT, EPFO, IP India, SEBI/BSE/NSE | Build only if a specific customer segment justifies the extra legal/engineering cost per source |
| Not Phase 2/3 at all — separate track | Commercial rentals, demographics, POIs, reviews, search trends | No free/legal government source exists; requires manual seeding or a paid vendor, and belongs to the "soft signal" enrichment layer discussed earlier, not the core registry engine |

## What's still genuinely unknown (flag for a dedicated check when that phase starts)

- Exact resource UUID and live field names for the Udyam OGD dataset (same reality-check
  process used for `mca_ogd` and `mca_last30days` — don't build against the catalog snippet
  alone)
- Current pricing/reliability comparison across GST verification resellers
- Whether DPDP Act (India's data protection law) imposes any specific handling requirement on
  director personal-data fields already being stored from MCA — this is a legal question, not
  an engineering one, and worth a real legal opinion before the product scales past MVP, not
  before Phase 1 ships
