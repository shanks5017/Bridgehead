# Validated Research Findings

This document contains the independent verification of the claims made in `docs/06_PHASE_2_SOURCE_RESEARCH_FINDINGS.md` and `docs/07_OPEN_SOURCE_REFERENCES.md`. Every finding is strictly rated on a confidence scale based on live verification against the actual sources (as of September 2026).

---

## 1. API Key Verification

**Claim:** The `mca_ogd` adapter uses a public demo API key (`579b464db66ec23bdd00000177271dbdcfbd4c9e77a7347d55b709c9`).
**Confidence:** **CONTRADICTED**

**Evidence:**
- A direct inspection of the live `.env` file reveals the `DATA_GOV_API_KEY` is currently set to `579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa`.
- While it shares the same 24-character prefix (`579b464db66ec23bdd000001`) common to data.gov.in keys, the suffix is completely different.
- A live web search for the exact key string currently in `.env` returns zero hits across tutorials or GitHub, strongly indicating it is a newly generated, private key rather than the shared demo key listed in the research document.
- **Actionable Takeaway:** The "Urgent" Phase 1 fix requested in the research document has already been applied.

---

## 2. Udyam MSME Dataset

**Claim:** data.gov.in hosts a daily-updated, *entity-level* dataset titled "List of MSME Registered Units under UDYAM" which can act as a primary discovery source.
**Confidence:** **CONTRADICTED**

**Evidence:**
- A live search of the `data.gov.in` catalog reveals that the available Udyam datasets are **aggregate**, not entity-level. For example, the live resource is titled *"District Wise Total MSME Registered Enterprises under UDYAM Registration till last date"*.
- The dataset provides summary counts (totals by district), not a row-by-row registry of individual companies with names, addresses, or CINs.
- **Actionable Takeaway:** Udyam data via OGD cannot be used as a Phase 2 discovery pipeline. The Phase 2 build order recommendation to prioritize Udyam based on it being an entity-level dataset is fundamentally flawed based on the current data catalog.

---

## 3. GST Verification Reseller APIs

**Claim:** Third-party resellers (Deepvue, WhiteBooks, gstinapi.in) hold GSP authorization and resell single-GSTIN verification as a REST API.
**Confidence:** **VERIFIED**

**Evidence:**
Live verification of current pricing and terms for the mentioned providers confirms this is a viable path:
- **Deepvue:** Offers a usage-based, prepaid wallet model starting at approximately ₹2 per check, with a free trial available.
- **WhiteBooks:** Uses a custom-quote, annual-tier model starting around ₹5,999/year for Starter tiers. They offer free sandbox access for integration testing.
- **gstincheck.co.in (gstinapi.in):** Offers a transparent pay-as-you-go model at ₹0.80 per credit (standard pack) or ₹0.60 per credit (bulk pack), with 20 free verifications for trial.
- **Actionable Takeaway:** GST verification via third-party APIs is highly feasible and cost-effective as an enrichment step for existing entities.

---

## 4. Other Government Sources (FSSAI, DPIIT, Commercial Rentals)

**Claim:** No open bulk dataset exists for FSSAI; DPIIT provides aggregate stats only; Commercial rentals have no free/government source.
**Confidence:** **STRONGLY INFERRED**

**Evidence:**
- No new open datasets or APIs have been published by the Indian government to contradict these findings. 
- FSSAI's FoSCoS portal remains locked behind encrypted payloads.
- DPIIT datasets on data.gov.in remain aggregate counts.
- **Actionable Takeaway:** The assessment to keep these out of early Phase 2/discovery priorities remains correct.

---

## 5. Open Source References (GitHub Repos)

**Claim:** The listed GitHub repositories provide reference code for MCA scrapers and entity resolution.
**Confidence:** **VERIFIED**

**Evidence:**
A live query against the GitHub API for the mentioned repositories confirms their existence and status:
- **India-specific MCA Repos:** As claimed, these are mostly single-author, non-production-grade scripts. Many lack a license file entirely (e.g., `prashver/company-data-scraper-MCA`, `PraneethKarnena/mca-web-scraping`) and have not been updated recently (e.g., last pushed between 2019 and 2022). They should be used strictly for reading field definitions, not for copying code.
- **OpenOwnership Repos:** These are active and properly licensed. For instance, `openownership/bodspipelines` uses AGPL-3.0 (updated 2025), and `register-ingester-oc` uses Apache 2.0 (updated 2024).

---

## 6. Entity Resolution Libraries (PyPI)

**Claim:** `dedupe`, `Splink`, and `Zingg` are the recommended entity resolution libraries for future phases.
**Confidence:** **VERIFIED**

**Evidence:**
Live verification of PyPI packages and documentation:
- **`dedupe` (v3.0.3):** Requires Python >= 3.8. It operates via an active-learning supervised workflow (`dedupe.console_label`), making it a strong fit for small, localized datasets.
- **`splink` (v4.0.16):** Requires Python >= 3.9. It uses probabilistic matching (Fellegi-Sunter model) and scales efficiently using DuckDB for local execution.
- **`zingg` (v0.7.0):** Requires Apache Spark (3.5.0+) and also relies on active learning. It is confirmed to be overkill for local, lightweight pipelines, aligning with the "no premature infrastructure" principle.
- **Actionable Takeaway:** When fuzzy matching is eventually needed, `dedupe` or `splink` (with DuckDB) are the correct tools for the Python environment.

---

## 7. OpenCorporates Architectural Precedent

**Claim:** OpenCorporates explicitly prefers bulk data dumps over APIs, and APIs over web scraping.
**Confidence:** **VERIFIED**

**Evidence:**
- The referenced OpenCorporates development blog post validates this hierarchy for fetching company register data at scale. 
- The principle of "brittle by design" (failing loudly when schema changes) is actively used in their `openc_bot` fetcher design.
