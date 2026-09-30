# 🧠 Zonek Intelligence 2.0 — Master Architecture & Development Plan

> **Document Version**: 3.0 — Zonek Intelligence 2.0
> **Last Updated**: April 18, 2026
> **Status**: Active Planning → Execution
> **Architecture Principle**: Zero Hallucination. Data First. Trust Always.

---

## 🎯 Project Vision & The Core Problem We Solve

Zonek Intelligence 2.0 is a **hyper-local AI-powered market feasibility engine** built for entrepreneurs in India.

**The Problem:** An entrepreneur wanting to open a business in a specific neighborhood has to guess three critical things:
1. Is there real demand for this business type here?
2. Is this location already saturated with competitors?
3. Can I even afford the commercial rent here?

Making the wrong call on any of these three means a failed business, lost capital, and lost livelihoods.

**Our Solution:** Zonek aggregates live scraped data (rentals, competitors), static government data (budgets, census, schemes), and live API data (weather, crop prices, infrastructure) into a single normalized knowledge base. Our AI reads only this real, verified data to produce a business feasibility report. No guessing. No hallucinating.

**The "50/100" Philosophy:** Every entrepreneur using Zonek gets 50% of their market research done for them before they spend their first rupee.

---

## 🏗️ System Architecture Overview

### Repository Structure
```
Zonek (Frontend - React/Vite)         → Existing project, shows the UI
zonek-intelligence2.0 (Backend)       → New dedicated Python backend for the AI pipeline
```

The frontend (Bridgehead/Zonek UI) calls the `zonek-intelligence2.0` Python backend via REST API. The AI reasoning engine lives entirely in the backend. The frontend only displays results.

### High-Level Component Map

```
[User Dashboard UI]
       |
       | HTTP POST /api/analyze
       |
[zonek-intelligence2.0 Python Backend]
       |
       |-----> [1. Query Router & Input Validator]
       |-----> [2. Parallel Data Fetcher]
       |           |----> [Live Scraper: OLX, MagicBricks, Justdial]
       |           |----> [Government API Caller: Crop, Weather, JJM, PMAY]
       |           |----> [Static DB Reader: Census, Budgets, Elections]
       |-----> [3. Data Normalizer & Tagger]
       |-----> [4. GraphRAG Knowledge Builder]
       |-----> [5. LLM Reasoning Engine (Qwen 2.5 via Ollama)]
       |-----> [6. Hallucination Firewall (Programmatic Verifier)]
       |-----> [7. Report Generator]
       |
[JSON Report Response → Frontend renders it]
```

---

## 📥 Step 1: User Input (The "Target")

This is the form the entrepreneur fills in on the dashboard.

### Required Inputs

| Input Field | Type | Example | Why We Need It |
|---|---|---|---|
| Business Category | Dropdown | `Cafe / Coffee Shop` | Determines which competitors and demand signals to fetch |
| Hyper-Local Area | Text / Pin Code | `RS Puram, Coimbatore` or `641002` | Scopes ALL data fetching to this exact geography |
| Investment Budget | Number (₹) | `₹10,00,000` | Filters rental listings to what is actually affordable |
| Space Requirement | Dropdown | `< 500 sqft`, `500-1000 sqft`, `> 1000 sqft` | Filters rental results to only relevant properties |
| Business Format | Dropdown | `Brick & Mortar`, `Cloud Kitchen`, `Co-working` | Adjusts the scoring logic of the feasibility report |

### Optional Inputs (For a Richer Report)

| Input Field | Example | Purpose |
|---|---|---|
| Target Customer | `College students, Office workers` | Narrows competitor and demand analysis |
| Are you open to alternate locations? | `Yes / No` | Enables the AI to suggest nearby better-performing zones |
| Years of planned operation | `3 years` | Used for long-term viability scoring using budget data |

---

## ⚙️ Step 2: The Parallel Data Fetching Pipeline

When the user clicks "Generate Market Intel", the system triggers a **single parallel pipeline** where all data fetching happens simultaneously. No step waits for another to finish.

This is the most critical engineering layer. All data fetched here is **tagged with its source and a UTC timestamp before it touches the AI.**

### 2A. Live Competitor Scraper
- **Sources:** Justdial, Sulekha
- **Data Fetched:** Business names, ratings, review count, address, phone, years in business, category
- **Scope:** Filtered strictly to the user's PIN code or neighborhood + a 2km radius
- **Tool:** Python `requests` + `BeautifulSoup` / `Playwright` for JS-rendered pages
- **Output:** JSON array of competitor objects, each tagged with `{ source: "justdial", scraped_at: "2026-04-18T10:00Z", location_verified: true }`
- **Failure Mode:** If scraper is blocked (captcha), system returns the last cached result from the DB, clearly flagged as `cached_at` with the date.

### 2B. Live Rental Scraper
- **Sources (in order of priority):** OLX, MagicBricks, 99Acres, NoBroker, QuikrHomes, PropTiger, Makaan
- **Data Fetched:** Property address, size (sqft), monthly rent, property type, broker/owner flag, listing URL, listing date
- **Scope:** Strictly filtered to: (a) commercial properties only, (b) user's selected location, (c) user's stated size requirement
- **Tool:** Python `requests` + `BeautifulSoup`. OLX scraper already exists in `zonek-OLX` repo — reuse directly.
- **Output:** JSON array of rental objects, each tagged with `{ source: "olx", url: "https://...", scraped_at: "...", price_per_sqft: 45 }`
- **Key Rule:** A minimum of 3 listings must exist to state an "average market rent." If fewer than 3 are found, the report explicitly says "Insufficient data for this micro-market."

### 2C. Government API Caller
- **Triggered by:** User's location (district/state is resolved from the pin code or city name)
- **APIs Called Simultaneously:**

| Data | API / Source | Update Frequency | What We Extract |
|---|---|---|---|
| Crop Prices | data.gov.in Agmarknet API | Live | Current produce prices in this district — signals agricultural economy health |
| Weather & Rainfall | OpenMeteo API (free, no key needed) | Live | Current season conditions — relevant for seasonal businesses |
| Dam Levels | State Water Resource Dept | Collected | Water security index for the region |
| Jal Jeevan Mission (JJM) | jaljeevanmission.gov.in API | Live | % of tap water coverage — signals infrastructure maturity |
| PMAY Housing | pmayg.nic.in API | Live | Number of sanctioned houses in district — indicates growth zone |
| Government Schemes | MyScheme API (myscheme.gov.in) | Static | Active central schemes relevant to the business category |
| Schools & Colleges | UDISE+ API | Static | Number of educational institutions — signals daytime foot traffic |
| Panchayat Data | egramswaraj.gov.in API | Static | Local governance data — relevant for rural locations |
| Transport | data.gov.in Transport API | Static | Bus routes, auto stands near location |
| Courts & Crime | State Police / NCRB PDF | Static (Parsed) | General safety index of the district |

- **Failure Mode:** If an API is down or returns no data, the field is marked as `"status": "unavailable"` in the normalized output. The AI is instructed to explicitly say "data unavailable" for that metric rather than guessing.

### 2D. Static Database Reader
These are datasets we have already pre-downloaded, cleaned, and stored in our own local MongoDB/PostgreSQL database. No external API call needed. Instant retrieval.

| Dataset | Source | Storage | What We Extract |
|---|---|---|---|
| Census / Population | Census of India 2011/2021 | Local DB | Population density, age groups, household income estimates |
| State-wise Budget | Karnataka, TN, Maharashtra, UP, WB, Delhi, Telangana Finance Depts | Local DB (PDF Parsed) | Capital expenditure allocated to this district, sector priorities |
| Election Data | Election Commission of India | Local DB | Sitting MLA/MP, recent election win margin — signals political stability |
| Infrastructure Projects | State RSS Feeds | Local DB (refreshed weekly) | Any upcoming metro, highway, or industrial project in the district |

---

## 🔧 Step 3: Data Normalization

After all parallel fetchers complete (or time out at 15 seconds), the raw data is fed into the **Normalizer**.

### Rules of Normalization
1. **Every data point gets a Source Tag:** `{ value: 45000, unit: "INR/month", source: "OLX", url: "https://...", timestamp: "2026-04-18T10:00Z" }`
2. **Geographic Validation:** Any rental or competitor result that does not match the queried PIN code or district is silently discarded. This prevents "geographic bleed" — the #1 cause of misleading reports.
3. **Deduplication:** If the same property listing appears on both OLX and MagicBricks, it is counted once.
4. **Confidence Flags:**
   - `HIGH_CONFIDENCE`: 5+ data points from 2+ sources
   - `MEDIUM_CONFIDENCE`: 3-4 data points from 1 source
   - `LOW_CONFIDENCE`: 1-2 data points (this is shown as a warning in the report)
5. **Outlier Rejection:** Any rental price more than 2 standard deviations away from the mean is discarded as a data error.
6. **Number Formatting:** All currency is normalized to INR. All area is normalized to sqft.

### Output: The "Normalized Intelligence Packet"

This is a single JSON object that contains everything the AI will ever see. It looks like this:

```json
{
  "query": {
    "business_type": "Cafe",
    "location": "RS Puram, Coimbatore",
    "pin_code": "641002",
    "budget_inr": 1000000,
    "generated_at": "2026-04-18T10:05Z"
  },
  "competitors": {
    "count": 12,
    "confidence": "HIGH_CONFIDENCE",
    "top_competitors": [ ... ],
    "source": "Justdial"
  },
  "rentals": {
    "average_monthly_rent_inr": 42000,
    "min_rent_inr": 28000,
    "max_rent_inr": 65000,
    "listings_found": 8,
    "confidence": "HIGH_CONFIDENCE",
    "listings": [ ... ]
  },
  "civic_data": {
    "rainfall_mm": 45.2,
    "water_coverage_percent": 78,
    "pmay_houses_sanctioned": 1200,
    "population_density_per_sqkm": 8500
  },
  "budget_data": {
    "state": "Tamil Nadu",
    "district_allocation_crore": 245,
    "infrastructure_focus": "Road expansion, IT corridor",
    "source_doc": "TN Budget 2025-26.pdf",
    "page_reference": 142
  }
}
```

---

## 📊 Step 4: The Data Room (Shown to User BEFORE the AI)

**This is our most important trust-building feature.**

Before the AI generates a single word, the frontend renders a "Data Room" dashboard showing all the raw facts we collected. The user can see and verify this data themselves.

### Data Room Sections

**Section A — Rental Market**
- Table of all properties found with their price, size, source, and a clickable link to the original listing.
- A calculated "Market Rent Range" card: Min ₹28,000 → Average ₹42,000 → Max ₹65,000/month.
- A "Download Rental Data" button (exports to CSV).

**Section B — Competitor Landscape**
- A list of existing businesses with their Justdial rating and distance from the target location.
- A "Saturation Score" card: e.g., "12 competitors in 2km radius — HIGH saturation."
- Clickable links to each competitor's Justdial page.

**Section C — Civic & Infrastructure Intel**
- Cards showing Water Coverage %, Active Government Schemes count, Population Density, Upcoming Infrastructure Projects.
- Each card shows the data source (e.g., "Source: JJM API, fetched today").

**Section D — Download**
- A single "Export Full Research Package" button that downloads a ZIP file containing:
  - `rentals.csv`
  - `competitors.csv`
  - `civic_data.json`
  - `data_sources.txt` (list of all URLs and APIs used)

---

## 🤖 Step 5: The LLM Reasoning Engine

### Model Stack

| Role | Model | Deployment | Purpose |
|---|---|---|---|
| Primary Reasoning | `qwen2.5:7b` | Local Ollama | Reads the Normalized Packet and generates the feasibility report |
| Embedding | `nomic-embed-text` | Local Ollama | Converts static PDF/text data into vectors for GraphRAG |
| Code Generation | `qwen2.5-coder:7b` | Local Ollama | Generates Python/SQL to perform numerical calculations (e.g., budget aggregations) |
| Production (Future) | Qwen 2.5 72B | Groq API Free Tier | When we need higher reasoning depth for complex reports |

### The System Prompt Architecture (Non-Negotiable Rules)

The system prompt given to the LLM is locked and cannot be changed by the user. It enforces the following rules:

```
RULES FOR THE AI ENGINE:
1. You are a business feasibility analyst for Zonek Intelligence.
2. You MUST use ONLY the data provided in the [CONTEXT] block below.
3. For every numerical figure you state (price, count, percentage), you MUST
   reference the source tag it came from.
4. If a data point is marked "status: unavailable", you MUST write
   "Data not available for this metric" — you may NOT estimate or interpolate.
5. If fewer than 3 rental listings exist, you MUST state "Insufficient rental
   data for a confident price estimate in this micro-market."
6. You may NOT use any knowledge from your training data for numerical claims.
7. Your output MUST be valid JSON conforming to the ReportSchema below.
```

### The Report Schema (Constrained Decoding)

The LLM output is forced to conform to this Pydantic schema using `llguidance` or Ollama's structured output feature. If the model tries to generate something outside this schema, the output is rejected:

```python
class ReportSection(BaseModel):
    finding: str
    data_value: str
    source_id: str       # Must match a tag from the Normalized Packet
    confidence: str      # HIGH / MEDIUM / LOW / UNAVAILABLE
    recommendation: str

class FeasibilityReport(BaseModel):
    overall_score: int          # 0-100
    verdict: str                # GO / CAUTION / NO-GO
    rental_analysis: ReportSection
    competitor_analysis: ReportSection
    civic_infrastructure: ReportSection
    budget_economic_context: ReportSection
    final_recommendation: str
    alternate_location_suggestion: Optional[str]
```

---

## 🛡️ Step 6: The Hallucination Firewall

This is a **deterministic Python script** — NOT another AI call. It runs immediately after the LLM produces its JSON report.

### Verification Rules
1. **Numerical Cross-Check:** Every number in the report is looked up against the Normalized Intelligence Packet. If the AI says "average rent is ₹42,000" but the packet says ₹41,800, it is accepted (within 5% tolerance). If it says ₹75,000 with no source, it is blocked.
2. **Source Tag Validation:** Every `source_id` in the report must exist in the Normalized Packet. If it references a non-existent source, the entire section is replaced with `"VERIFICATION_FAILED: Source not found."`.
3. **Confidence Downgrade:** If the LLM reports `HIGH_CONFIDENCE` on a metric that had `LOW_CONFIDENCE` in the Normalized Packet, it is automatically downgraded.
4. **Missing Data Policy:** Any report section where the LLM failed to output `"Data not available"` for an unavailable metric is flagged and corrected automatically.

### What Passes vs. What is Blocked

| Scenario | Firewall Action |
|---|---|
| AI states ₹42,000 rent. Packet confirms ₹41,800 from OLX. | ✅ PASS |
| AI states ₹42,000 rent. No rental data was found in packet. | ❌ BLOCKED → replaced with "Data Unavailable" |
| AI says "12 competitors". Justdial data confirms 12. | ✅ PASS |
| AI says "the area has excellent schools" with no source. | ❌ BLOCKED → removed from report |
| AI correctly says "Water data unavailable". | ✅ PASS |

---

## 📝 Step 7: The Final Report Rendered to the User

After passing the Hallucination Firewall, the JSON report is sent to the frontend where it is rendered as a beautiful, structured dashboard.

### Report Layout

**Header:** Overall Score Card `68/100 — CAUTION`

**Section 1 — Verdict Summary**
> "Launching a Premium Cafe in RS Puram, Coimbatore (641002) carries moderate risk. While civic infrastructure is strong (78% water coverage, 2 active PMAY projects), the market is currently saturated with 12 direct competitors in a 2km radius. Average commercial rent of ₹42,000/month *(OLX, verified Apr 18 2026)* represents 42% of your stated annual budget in fixed costs alone."

**Section 2 — Rental Analysis** (with inline citations)
> "Market rent ranges from ₹28,000 to ₹65,000/month for commercial spaces. 8 listings verified across OLX and MagicBricks. *(See Data Room for full list)*"

**Section 3 — Competitor Landscape**
> "12 established cafes operating within 2km. Top competitor: Cafe Coffee Day (RS Puram branch), rated 4.1/5 with 230+ reviews on Justdial. *(Source: Justdial, Apr 18 2026)*"

**Section 4 — Civic & Government Context**
> "Tamil Nadu district budget 2025-26 allocates ₹245 crore to Coimbatore with emphasis on road expansion and IT corridor development. *(Source: TN Finance Dept Budget 2025-26, Page 142)*. This suggests medium-term commercial foot traffic growth."

**Section 5 — Final Recommendation**
> "Recommend reconsidering location. Saravanampatti (5km north) shows 4 competitors and average rent of ₹28,000/month — significantly better market entry conditions for the same business category."

**Footer:** Data Sources, Timestamps, Download Full Report PDF button.

---

## 🔗 Connection Map (Frontend ↔ Backend)

```
Zonek Frontend (React/Vite — existing project)
    |
    | POST /api/v1/analyze
    | Body: { business_type, location, budget, size, format }
    |
zonek-intelligence2.0 Python Backend (FastAPI)
    |
    | Response: { status, data_room: {...}, report: {...}, sources: [...] }
    |
    Frontend renders:
        - Step 1: "Analyzing..." progress screen
        - Step 2: Data Room dashboard (rentals table, competitors list, civic cards)
        - Step 3: AI Feasibility Report (after user clicks "Generate Report")
```

### API Endpoints (zonek-intelligence2.0 FastAPI Backend)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/analyze` | POST | Main pipeline trigger. Returns Data Room + Report |
| `/api/v1/status/{job_id}` | GET | Check async pipeline progress (for the live loading screen) |
| `/api/v1/export/{job_id}` | GET | Download full research package as ZIP |
| `/api/v1/health` | GET | System health check |

---

## 📦 Tech Stack — zonek-intelligence2.0 Backend

| Layer | Technology | Purpose |
|---|---|---|
| Web Framework | Python FastAPI | Async REST API, fast, typed |
| LLM Runtime | Ollama (local) | Runs Qwen 2.5 7B and nomic-embed-text locally |
| LLM Structured Output | Ollama format=json + Pydantic | Forces the report into schema |
| Vector Database | ChromaDB (local, free) | Stores embedded static PDF/census data for GraphRAG |
| Web Scraping | BeautifulSoup + Playwright | Scrapes OLX, Justdial, MagicBricks |
| PDF Parsing | pdfplumber | Extracts tables from State Budget PDFs |
| Task Queue | Python asyncio / ThreadPoolExecutor | Parallel data fetching |
| Database | MongoDB (reusing existing Atlas) | Stores cached scrape results, user query history |
| Environment | python-dotenv | Secrets management |

---

## 🗓️ Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize `zonek-intelligence2.0` FastAPI project structure
- [ ] Set up Ollama connection and test `qwen2.5:7b` with a structured JSON prompt
- [ ] Set up ChromaDB locally and test `nomic-embed-text` embedding
- [ ] Write the Data Normalizer class with source tagging logic
- [ ] Write the Hallucination Firewall verification script

### Phase 2: Data Scrapers (Week 2-4)
- [ ] Port and adapt OLX rental scraper from `zonek-OLX` repo
- [ ] Build Justdial competitor scraper (Playwright-based for JS rendering)
- [ ] Build government API caller for: OpenMeteo, JJM API, MyScheme API
- [ ] Build PDF parser for State Budget PDFs (Karnataka, TN, Maharashtra to start)
- [ ] Load Census and Population data into ChromaDB as vectors

### Phase 3: The Pipeline (Week 4-5)
- [ ] Wire all scrapers into the parallel asyncio pipeline
- [ ] Implement the 15-second timeout and graceful degradation logic
- [ ] Build the Normalized Intelligence Packet JSON builder
- [ ] Write the Pydantic `FeasibilityReport` schema
- [ ] Test full pipeline end-to-end with "Cafe, Coimbatore" as test case

### Phase 4: LLM Integration (Week 5-6)
- [ ] Write the LLM system prompt with hard grounding constraints
- [ ] Implement Ollama structured output (force JSON schema)
- [ ] Implement the Hallucination Firewall programmatic verifier
- [ ] Test and tune: AI must fail gracefully when data is missing

### Phase 5: Frontend Connection (Week 6-7)
- [ ] Build `POST /api/v1/analyze` endpoint in FastAPI
- [ ] Connect existing Zonek frontend to the new backend API
- [ ] Build the "Analyzing..." live progress screen on the frontend
- [ ] Build the Data Room UI component (rentals table, competitors list, civic cards)
- [ ] Build the Feasibility Report UI component with inline citations
- [ ] Build the "Export Research Package" ZIP download

### Phase 6: Fine-Tuning (Month 3 — After MVP Works)
- [ ] Curate 500-1000 manually written perfect feasibility reports as training data
- [ ] Run QLoRA fine-tuning on `Llama 3.1 8B` using Unsloth on local GPU
- [ ] Test fine-tuned model: does it write better reports than the base model?
- [ ] Deploy fine-tuned model to Ollama, replace base model in pipeline

---

## 💰 Cost Strategy (Zero to Revenue)

| Phase | Hosting | AI Cost | Total/Month |
|---|---|---|---|
| Development | Localhost | Free (Ollama) | ₹0 |
| MVP Launch | Railway (free tier) | Free (Ollama / Groq free) | ₹0 - ₹500 |
| Growth | Apply for AWS/Azure Startup Credits ($100k) | Groq API (~$0.0001/token) | ₹0 (credits) |
| Production | Dedicated VPS with GPU | Self-hosted Qwen 72B | TBD from revenue |

---

## ✅ Definition of "Done" for MVP

The MVP is complete when a user can:
1. Enter "Cafe" + "RS Puram, Coimbatore" + "₹10 Lakh budget"
2. See a live progress screen showing the pipeline working
3. See a Data Room with real, clickable rental links and real competitor names
4. Download the research as a CSV
5. Click "Generate Report" and receive a structured feasibility report
6. Every number in that report is traceable to a real data source shown in the Data Room

**If a number cannot be traced, it does not appear in the report. Period.**

---

*This is the master reference document for Zonek Intelligence 2.0.*
*Zonek frontend repo: `d:\my projects\my projects\Zonek`*
*Intelligence backend repo: `zonek-intelligence2.0` (to be initialized)*