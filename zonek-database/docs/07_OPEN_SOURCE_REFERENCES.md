# Open Source References

Curated from research, not exhaustive. Each entry says what to actually *learn* from it —
most of these should not be copied wholesale (several have no license file, unclear
production-readiness, or don't match our schema), but each teaches something real.

---

## 1. Closest architectural precedent — OpenCorporates' own fetcher design

This is the single most useful reference found, because it's the global equivalent of what
we're building — a multi-jurisdiction company registry aggregator — and they've published how
their fetcher pipeline actually works:

- **Source priority, confirmed by a real production system at scale:** OpenCorporates
  explicitly prefers, in order: (1) **bulk data dumps** (CSV/XML), (2) **structured APIs**,
  (3) **web scraping**, only as a last resort. This is exactly the ordering already used in our
  own source specs (MCA OGD bulk file first) — good independent validation that the approach is
  right, not just cautious.
- **"Brittle by design" — worth adopting verbatim:** their fetcher code is deliberately written
  to break loudly and immediately when a source's page layout or field structure changes,
  rather than silently degrading. This is the same principle already written into
  `04_PIPELINE_AND_AUTOMATION_SPEC.md` ("a failed job must never be marked `success`") — good to
  know we independently arrived at the same discipline a production system at scale actually
  uses.
- **Stack (for reference, not to copy):** Ruby, Nokogiri/Mechanize for scraping, their own
  `openc_bot` gem, SQLite for intermediate persistence. Not directly reusable in our Python
  stack, but the *shape* of the pipeline (fetch → persist raw → normalize → flag breaks) is the
  reference worth studying: https://blog.opencorporates.com/2018/11/28/from-company-register-to-standardized-open-data-our-processes-explained-part-3-development/

### OpenOwnership's related open-source repos (actually usable code, Python/Ruby)

These implement the ingestion/transformation layer around OpenCorporates-style bulk data —
worth reading for real, working code patterns even though they're UK/EU-registry focused:

- `github.com/openownership/bodspipelines` — Python, transforms raw registry data into a
  standardized statement format (their "BODS" schema). Useful reference for how to structure a
  normalization layer that's source-agnostic.
- `github.com/openownership/register-ingester-oc` — ingester for OpenCorporates bulk data into
  Elasticsearch. Relevant later, once we build the search layer on top of the canonical store.
- `github.com/openownership/register-sources-oc` — the "sources" layer pattern (read/write raw
  source records) — structurally similar to our `raw_ingest` table concept, worth comparing.

---

## 2. India-specific MCA repos — small, illustrative, not production-grade

These are useful for seeing *what fields real people extract* and *what breaks*, not as code to
copy directly — most are single-author scripts, several use Selenium/browser automation for
things our `mca_ogd` adapter already does more cleanly via the direct API:

- `github.com/prashver/company-data-scraper-MCA` — Selenium+Pandas, searches by company name,
  extracts master data. Useful for seeing the manual portal-search flow if we ever need
  name-based lookup as a fallback.
- `github.com/PraneethKarnena/mca-web-scraping` — simple CIN → company + director info script.
  Small, readable, good for seeing the minimal field set someone considered "the essentials."
- `github.com/spfrantz/MCA-CSR-Scraper` — **worth reading for etiquette practices**, even though
  it targets CSR disclosures (unrelated to our data): includes a 1-second delay between
  requests, a custom identifying `user-agent` header with contact info, and a `--test` mode that
  limits a run to 10 records before a full run. These are good scraping citizenship habits to
  carry into any future adapter that requires more than a plain bulk-file download.
- `github.com/araystech/mca-data-api` — a slightly more structured attempt at wrapping MCA
  search, directors, and document download/tracking into one API surface. Worth skimming for
  the breadth of endpoints someone else found useful (director history, SRN-based document
  download) — some of this maps to later-phase "filings" features, not Phase 1.
- `github.com/matcdac/CorporateIndiaDataSourceXLSX` — targets the same
  `incorporated-closed-month` MCA page family as our `mca_last30days` adapter. Worth a quick
  diff against our own README's findings — if their notes on the page's behavior differ from
  what we found, that's worth knowing before Phase 2 hardening.
- `github.com/org-id/register` — not a scraper, but a **registry-of-registries schema**
  (org-id.guide) that catalogs how to identify/access company registers across ~140 countries,
  including a structured entry for India's MCA (`in-mca.json`). Useful as a reference for how to
  think about CIN/LLPIN as a globally-namespaced identifier if Zonek ever needs to interoperate
  with international data.

**Caution common to all of the above:** most have no explicit license file. Treat them as
*reading material for approach and field lists*, not as code to copy into the Zonek repo
wholesale — write our own implementation informed by what they reveal, the same way the
`mca_ogd` adapter was built from live-source research rather than copied from a tutorial.

---

## 3. Entity resolution libraries — save for when fuzzy matching is actually needed

Phase 1 uses CIN-only deterministic matching by design (see `01_TEAM_ROLES_AND_OWNERSHIP.md`).
These become relevant later, when Udyam/GST records need to be matched against MCA companies
without a shared exact key (e.g. matching a Udyam "unit name" to an MCA "company name" when
there's no CIN in the Udyam record):

- **`dedupe` (dedupeio/dedupe)** — Python, ML-based fuzzy matching with active learning (you
  label some example pairs, it learns your matching rules). Good fit for a small team: doesn't
  need Spark, works on moderate-sized datasets, well-documented with real examples.
- **Splink** — probabilistic record linkage (Fellegi-Sunter model), used by UK government data
  science teams for exactly this kind of registry-matching problem. More statistically rigorous
  than `dedupe`, steeper learning curve — worth evaluating if `dedupe`'s simpler approach isn't
  accurate enough once we're matching across three-plus sources.
- **Zingg** — Spark-based, built for large-scale entity resolution. Overkill for Zonek's likely
  data volume at Phase 2/3 — flagging only so the team knows it exists and consciously chooses
  not to reach for it prematurely, consistent with the "no premature infrastructure" principle
  already in `00_ARCHITECTURE_OVERVIEW.md`.

**Recommendation:** when fuzzy matching becomes necessary (likely once Udyam is integrated),
start with `dedupe` — smallest footprint, matches our current stack, good documentation. Don't
reach for Splink or Zingg unless `dedupe`'s accuracy genuinely proves insufficient at our scale.

---

## 4. GST scraping reference (for understanding the mechanism, not for building on)

- `github.com/shubham-dube/GST-Verification-API` — open source, shows the real mechanics of the
  GST portal's public search: session/cookie handling, CAPTCHA retrieval and submission, request
  shape. Confirms what the Phase 2 source research already found (GST's public search requires
  CAPTCHA handling, not a clean API) — useful as a working reference for the actual request/
  response shape if we ever build a captcha-handling adapter, but per
  `06_PHASE_2_SOURCE_RESEARCH_FINDINGS.md`, the recommended Phase 2 path is a paid reseller API
  (Deepvue, etc.), not scraping this ourselves — keep this repo as a fallback reference only.

---

## 5. forthepeople.in — already covered in depth in the prior research pass

Repository: `github.com/jayanthmb14/forthepeople` — open source, Next.js + Prisma stack, cron-
scheduled refresh per data module, same NDSAP/GODL sourcing posture as MCA. Worth a direct code
read (not just the product-level review from before) for exactly one thing: **how they structure
a cron job per data module** in `.env.local` / Prisma setup — since our GitHub Actions workflow
spec (`04_PIPELINE_AND_AUTOMATION_SPEC.md`) is solving the identical scheduling problem, just
with a different DB layer (Postgres directly vs. Prisma ORM).

---

## What NOT to copy, and why

None of the India-specific MCA repos above should be pulled in as a dependency or copy-pasted
wholesale — they're single-author, unlicensed, and in some cases already superseded by the
`mca_ogd`/`mca_last30days` adapters actually built (which go through the official OGD API
directly, cleaner than most of these scripts' Selenium-based approach). Their value is entirely
as **reference reading** — field lists, request/response shapes, and etiquette practices — the
same "research before coding" discipline already applied to the live MCA sources.
