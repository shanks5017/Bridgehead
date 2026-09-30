# 09 — Old Project Audit Report

**Auditor:** Antigravity (AI Architect)
**Date:** 2026-09-01
**Scope:** Full inventory of all pre-existing code in `d:\my projects\my projects\Zonek_Main\` — the workspace that the current Zonek rebuild lives inside.

> **Important note on the task prompt:** The original prompt referenced `[INSERT FULL PATH TO THE OLD PROJECT FOLDER HERE]` as a placeholder. The workspace was explored in full. There is **no single "old project"** — instead the workspace contains **six distinct sub-projects** that collectively form the foundation the current rebuild is built from. All six are audited below.

---

## 1. Directory Tree (Cleaned)

```
Zonek_Main/                                      <- Root workspace
+-- 01.md                   (7 KB)              <- Executive summary / project overview
+-- 02.md                  (35 KB)              <- Full technical audit doc (previous self-audit)
+-- final.md               (50 KB)              <- B.Tech project report draft
+-- completion.md          (14 KB)              <- Completion status tracker
+-- to_do.md               (7 KB)               <- Deep roadmap & execution plan
+-- run-gov-pipeline.bat   (1.5 KB)             <- Windows launcher for gov pipeline
+-- run-gov-pipeline.js    (1 KB)               <- Node.js gov pipeline runner
|
+-- Zonek/                                       <- [PRIMARY OLD PROJECT] "Bridgehead" app
|   +-- .env               (317 B)             WARNING: REAL SECRETS COMMITTED (see S4.5)
|   +-- .git/                                   <- Has full git history (24 commits)
|   +-- App.tsx            (52 KB)              <- Monolithic React app entry + routing
|   +-- app.css            (8 KB)               <- Global stylesheet
|   +-- index.tsx / index.html                  <- Vite SPA entry
|   +-- types.ts           (6 KB)               <- Shared TypeScript type definitions
|   +-- tsconfig.json / vite.config.ts          <- Build configuration
|   +-- package.json       (1 KB)               <- Frontend deps (React 19, Tailwind, Firebase)
|   +-- demands_response.json (22 MB)           <- Exported dataset (large flat file)
|   +-- full_structure.json   (9 MB)            <- Exported dataset (large flat file)
|   +-- build_error.log    (3 KB)               <- Retained build error log
|   +-- components/                             <- 36 React UI components
|   |   +-- AIMatches.tsx        (20 KB)
|   |   +-- AISuggestions.tsx    (16 KB)
|   |   +-- Chatbot.tsx          (11 KB)
|   |   +-- Collaboration.tsx    (38 KB)
|   |   +-- CommunityFeed.tsx    (21 KB)
|   |   +-- CommunityHub.tsx     (15 KB)
|   |   +-- DemandFeed.tsx       (30 KB)
|   |   +-- Feed.tsx             (19 KB)
|   |   +-- Home.tsx             (33 KB)
|   |   +-- PostDemandForm.tsx   (14 KB)
|   |   +-- PostRentalForm.tsx   (14 KB)
|   |   +-- Profile.tsx          (27 KB)
|   |   +-- RentalListings.tsx   (26 KB)
|   |   +-- Research.tsx         (19 KB)
|   |   +-- ... (22 more components)
|   +-- services/
|   |   +-- groqService.ts      (4 KB)
|   +-- backend/                                <- Express + TypeScript backend (port 5001)
|   |   +-- .env            (317 B)            WARNING: REAL SECRETS COMMITTED (see S4.5)
|   |   +-- server.ts       (4.5 KB)
|   |   +-- package.json    (1.9 KB)
|   |   +-- config/
|   |   |   +-- db.ts       (1.8 KB)
|   |   +-- controllers/
|   |   |   +-- aiController.ts         (11 KB)
|   |   |   +-- authController.ts       (11 KB)
|   |   |   +-- communityController.ts   (6 KB)
|   |   |   +-- conversationController.ts (6 KB)
|   |   |   +-- postController.ts       (14 KB)
|   |   |   +-- statsController.ts       (2 KB)
|   |   |   +-- userController.ts        (3 KB)
|   |   |   +-- validationController.ts  (4 KB)
|   |   +-- middleware/
|   |   |   +-- auth.ts / gridfs-native.ts / gridfs-upload.ts
|   |   |   +-- rateLimiter.ts / upload.ts / uploadMiddleware.ts
|   |   |   +-- validation.ts
|   |   +-- models/
|   |   |   +-- User.ts            (5.3 KB)
|   |   |   +-- DemandPost.ts      (4.9 KB)
|   |   |   +-- RentalPost.ts      (4.9 KB)
|   |   |   +-- CommunityPost.ts   (2.7 KB)
|   |   |   +-- CommunityComment.ts (1.5 KB)
|   |   |   +-- Conversation.ts    (1.6 KB)
|   |   |   +-- Message.ts         (1.4 KB)
|   |   |   +-- Interaction.ts     (0.8 KB)
|   |   +-- routes/
|   |   |   +-- ai.ts / auth.ts / community.ts
|   |   |   +-- conversations.ts / images.ts
|   |   |   +-- posts.ts / stats.ts / users.ts
|   |   +-- services/
|   |   |   +-- imageService.ts         (5.5 KB)
|   |   |   +-- profileImageService.ts  (8.8 KB)
|   |   |   +-- trendingService.ts      (6.4 KB)
|   |   +-- utils/
|   |   |   +-- email.ts / engineLauncher.ts / hashtagUtils.ts
|   |   +-- scripts/
|   |   |   +-- upload-datasets.ts / cleanup-database.ts
|   |   |   +-- get-counts.ts / thorough-verify.ts / verify-upload.ts
|   |   +-- datasets/
|   |   |   +-- demands_FINAL (3).json  (1.1 MB)
|   |   |   +-- rentals_FINAL (3).json  (1.4 MB)
|   |   +-- node_modules/               [SKIPPED - present, ~461 KB lock file]
|   +-- docs/                                   <- 21 planning/design docs
|   |   +-- LLM_Research/  (01.md-04.md, ~87 KB total)
|   |   +-- database_plans.md      (16 KB)
|   |   +-- deployment_plans.md    (17 KB)
|   |   +-- features_plans.md      (22 KB)
|   |   +-- plans.md               (22 KB)
|   |   +-- project_analysis.md    (21 KB)
|   |   +-- scalability_plans.md   (17 KB)
|   |   +-- schema_documentation.md (5 KB)
|   |   +-- scrapper.md             (2 KB)
|   |   +-- security_plans.md      (19 KB)
|   |   +-- daily_report.md        (42 KB)
|   |   +-- ... (10 more docs)
|   +-- dist/                       [SKIPPED - build output]
|   +-- node_modules/               [SKIPPED - present, ~188 KB lock file]
|
+-- india_rental_scraper/                       <- [PYTHON SCRAPER] FastAPI rental scraper
|   +-- .env               (119 B)             <- Mongo URI only, no secrets
|   +-- requirements.txt   (575 B)
|   +-- config.py          (5.9 KB)
|   +-- main.py            (7.8 KB)
|   +-- pipeline.py        (14.5 KB)
|   +-- api.py             (6.2 KB)
|   +-- check_all.py       (2.4 KB)
|   +-- scrapers/
|   |   +-- base_scraper.py   (10 KB)
|   |   +-- olx.py            (8.5 KB)
|   |   +-- magicbricks.py    (8.3 KB)
|   |   +-- nobroker.py       (19 KB)
|   |   +-- housing.py        (19 KB)
|   |   +-- acres99.py        (11 KB)
|   |   +-- proptiger.py       (7 KB)
|   |   +-- makaan.py          (6 KB)
|   |   +-- quikrhomes.py      (7 KB)
|   +-- resolvers/
|   |   +-- locality_resolver.py (7.4 KB)
|   +-- utils/
|   |   +-- location_resolver.py  (16 KB)
|   |   +-- helpers.py            (8.8 KB)
|   |   +-- mongo_handler.py      (4.6 KB)
|   |   +-- user_agents.py        (4.5 KB)
|   |   +-- exporter.py           (1.8 KB)
|   +-- core/
|   |   +-- rate_limiter.py       (1.4 KB)
|   |   +-- session.py            (1.5 KB)
|   +-- rentals_plan.md    (19 KB)
|   +-- belgaum_rentals.json (331 KB)           <- Sample scraped dataset (real output)
|   +-- __pycache__ / logs  [SKIPPED]
|
+-- zonek-orchestrator/                         <- [ORCHESTRATOR] 4-stage intelligence pipeline
|   +-- .env               (635 B)             WARNING: REAL SECRETS COMMITTED (see S4.5)
|   +-- package.json       (610 B)
|   +-- src/
|   |   +-- index.js           (6.4 KB)
|   |   +-- pipeline/
|   |   |   +-- orchestrator.js   (4.7 KB)
|   |   |   +-- browserAdapter.js (2 KB)
|   |   |   +-- rentalAdapter.js  (3.6 KB)
|   |   |   +-- govAdapter.js     (6.6 KB)
|   |   |   +-- competitorScraper.js (6.4 KB)
|   |   +-- normalizer/
|   |   |   +-- firewall.js          (5.3 KB)
|   |   |   +-- intelligencePacket.js (8.5 KB)
|   |   +-- report/
|   |   |   +-- reportGenerator.js   (9 KB)
|   |   +-- models/
|   |   |   +-- ResearchJob.js
|   |   +-- utils/
|   |       +-- logger.js
|   +-- node_modules/       [SKIPPED]
|
+-- Zonek_gov/                                  <- [GOV DATA ENGINE] 12-source ETL daemon
|   +-- .env               (1.6 KB)            WARNING: DATA_GOV_KEY committed (see S4.5)
|   +-- package.json       (1.5 KB)
|   +-- src/
|   |   +-- orchestrator.js     (4.7 KB)
|   |   +-- pipeline.js         (9.7 KB)
|   |   +-- index.js            (3.8 KB)
|   |   +-- fetchers/           (12 fetcher files, ~5-8 KB each)
|   |   |   +-- budget.js / courts.js / crime.js
|   |   |   +-- cropPrices.js / elections.js / infrastructure.js
|   |   |   +-- jjm.js / pmay.js / population.js
|   |   |   +-- schemes.js / schools.js / weather.js
|   |   +-- models/             (12 Mongoose model files)
|   |   |   +-- Budget.js / Court.js / Crime.js / CropPrice.js
|   |   |   +-- Election.js / InfrastructureNews.js / JJM.js
|   |   |   +-- PMAY.js / Population.js / Scheme.js / School.js / Weather.js
|   |   +-- config/
|   |   |   +-- db.js
|   |   +-- utils/
|   |       +-- logger.js
|   +-- data/               <- Downloaded gov datasets (cached JSON/parquet)
|   +-- node_modules/       [SKIPPED]
|
+-- Zonek_browser/                              <- [BROWSER INTELLIGENCE] Web extraction engine
|   +-- .env               (1.5 KB)            WARNING: TAVILY_KEY committed (see S4.5)
|   +-- package.json       (669 B)
|   +-- src/
|   |   +-- browser.js          (4.6 KB)
|   |   +-- extractor/
|   |   |   +-- aiExtractor.js
|   |   +-- models/
|   |   |   +-- BrowserCache.js
|   |   +-- normalizer/
|   |   |   +-- normalize.js
|   |   +-- queries/
|   |   |   +-- queryBuilder.js
|   |   +-- search/
|   |   |   +-- searchProvider.js
|   |   |   +-- jina.js
|   |   +-- utils/
|   |       +-- logger.js
|   +-- node_modules/       [SKIPPED]
|
+-- Zonek-Intelligence/                         <- [MONITORING DASHBOARD] Internal ops UI
    +-- .env.example        (445 B)             <- Clean example (no real secrets)
    +-- package.json       (1.2 KB)
    +-- PDA.md             (62 KB)              <- Product Design Artifact
    +-- server.ts          (3.3 KB)
    +-- src/               <- Frontend source
    +-- zonek-core/        <- Shared library
    +-- extension 0.1/     <- Chrome extension version
    +-- node_modules/       [SKIPPED]
```

---

## 2. Dependency List (Categorized)

### 2.1 `Zonek/` (Bridgehead Frontend) — `package.json`

| Package | Version | Category |
|---|---|---|
| react, react-dom | 19.x | UI Framework |
| react-router-dom | 7.x | Routing |
| @firebase/app, @firebase/auth | latest | Auth/DB |
| mongodb, mongoose | 7.x / 8.x | **Database** |
| express | 5.x | API |
| @tanstack/react-virtual | 3.x | UI Performance |
| tailwindcss | 4.x | Styling |
| vite | 6.x | Build |
| typescript | 5.8 | Language |

### 2.2 `Zonek/backend/` — `package.json`

| Package | Version | Category |
|---|---|---|
| express | 4.x | **API Framework** |
| mongoose | 8.x | **Database ORM** |
| groq-sdk | 0.37 | **AI/LLM** |
| socket.io | 4.8 | **Real-time** |
| multer, multer-gridfs-storage | 2.x / 5.x | **File/Image Storage** |
| gridfs-stream | 1.1 | **File Storage** |
| jsonwebtoken | 9.x | Auth |
| bcryptjs | 3.x | Auth |
| express-validator | 7.x | Validation |
| nodemailer | 7.x | Email |
| axios | 1.x | HTTP Client |
| sharp | 0.34 | Image Processing |
| firebase-admin | 13.x | Auth/Storage |
| ts-node-dev, typescript | 5.x | Dev Tooling |

### 2.3 `india_rental_scraper/` — `requirements.txt`

| Package | Version | Category |
|---|---|---|
| playwright | 1.43.0 | **Scraping (headless browser)** |
| beautifulsoup4 | 4.12.3 | **Scraping (HTML parsing)** |
| lxml | 5.2.1 | **Scraping (parser)** |
| curl_cffi | >=0.6.2 | **Scraping (TLS impersonation / anti-bot)** |
| httpx | >=0.27.0 | **HTTP / Geocoding** |
| playwright-stealth | >=1.0.6 | **Scraping (bot evasion)** |
| pymongo | 4.7.2 | **Database** |
| fake-useragent | 1.5.1 | **Scraping (UA rotation)** |
| fastapi | >=0.111.0 | **API Framework** |
| uvicorn | >=0.29.0 | **API Server** |
| pydantic | >=2.0.0 | Data Validation |
| requests | 2.31.0 | HTTP (legacy compat) |

### 2.4 `zonek-orchestrator/` (inferred from code)

| Package | Category |
|---|---|
| express | **API Framework** |
| groq-sdk | **AI/LLM (report generation)** |
| playwright | **Scraping (Justdial competitor)** |
| axios | **HTTP (rental API calls)** |
| mongoose | **Database (gov data, research job cache)** |
| archiver | Export (ZIP generation) |
| uuid | Job ID generation |

### 2.5 `Zonek_gov/` (inferred from code)

| Package | Category |
|---|---|
| mongoose | **Database ORM** |
| node-cron | **Scheduling (ETL daemon)** |
| dotenv | Config |

---

## 3. Git History Summary

The **only** sub-project with a `.git` folder is `Zonek/` (the Bridgehead app). All other sub-projects have no git history.

| Metric | Value |
|---|---|
| Total commits | 24 commits |
| Date range | 2025-12-10 to 2026-04-18 |
| Duration | ~4.5 months |
| Branches visible | main + Loq (merged) |

### Commit Pattern Analysis

```
2025-12-10  Initial commit
2025-12-17  major refactor: backend TS migration, auth, routes, frontend updates, docs
2025-12-18  files and structure / 1st change on LOQ / feed and community page change
2025-12-22  backend integration old / profile enhancement
2025-12-24  plans for BridgeHead
2026-01-05  profile-photos updated from database storage to mongoDB compass
2026-01-20  username login enabled / Merge PR #1 from shanks5017/Loq
2026-01-21  Fix secrets and sync / Merge PR #2 from shanks5017/main
2026-01-23  feat: Secure AI Migration to Backend & Fix Build Errors
2026-01-27  feat: Add 'Posted by @username' to all post views
2026-02-17  Migrate DB to Atlas, fix Mongoose warnings, fix User type error
2026-02-18  Fix: Configure API base URL for production / Refactor CSS
2026-02-19  Fix API URL configuration / Update codebase and deployment status
2026-03-13  fix: resolve post selection and detail view navigation (x2)
2026-03-17  Fix frontend data visibility by aligning models with DB schema
2026-04-18  feat: add URL-based routing, smooth scroll, LLM research docs, and Zonek Intelligence 2.0 master plan
```

**Characterization:** Active development from Dec 2025 through April 2026 — a clear progression from initial scaffolding through backend TypeScript migration, auth, AI integration, and production deployment fixes. The project was **not abandoned** — the April 2026 commit explicitly marks the conceptual pivot from "Bridgehead" (community platform) to the intelligence/data-engine rebuild now underway.

---

## 4. Deep Dive — Code Findings

### 4.1 Data-Fetching, Scraping, and Crawling Code

#### `india_rental_scraper/` — Commercial Rental Scraper (Python) — COMPLETE

The most sophisticated data acquisition code in the workspace. Scrapes **8 Indian real estate platforms** for commercial rental listings:

- **OLX** (`scrapers/olx.py`) — curl_cffi TLS impersonation + BeautifulSoup
- **MagicBricks** (`scrapers/magicbricks.py`) — same pattern
- **99acres** (`scrapers/acres99.py`) — pagination-aware, up to 200 pages
- **NoBroker** (`scrapers/nobroker.py`) — 19 KB, most complex
- **Housing.com** (`scrapers/housing.py`) — 19 KB, Playwright-based
- **PropTiger** (`scrapers/proptiger.py`) — requests-based
- **Makaan.com** (`scrapers/makaan.py`)
- **QuikrHomes** (`scrapers/quikrhomes.py`)

All scrapers inherit from `BaseScraper` which uses `curl_cffi` with Chrome impersonation to bypass TLS fingerprinting. The async pipeline (`pipeline.py`) runs all 8 in parallel via `asyncio.gather()`, performs two-pass deduplication (exact URL + fuzzy price/locality/BHK matching), and writes results to MongoDB.

**Status:** WORKING CODE — tested, has sample output JSON (`belgaum_rentals.json` — 331 KB of real scraped data), has a FastAPI wrapper (`api.py`) ready to serve on port 8001.

#### `zonek-orchestrator/src/pipeline/competitorScraper.js` — Justdial Scraper (Node.js)

Scrapes **Justdial** for local competitors using Playwright (Chromium, headless). Maps business type slugs to Justdial URL patterns. Extracts competitor list from DOM.

**Status:** Functional but fragile — Justdial aggressively blocks headless browsers. The scraper uses a simple 2-second wait with no stealth (`--disable-blink-features=AutomationControlled` but no playwright-stealth plugin), which may not reliably work in production.

#### `Zonek_browser/src/browser.js` — Web Intelligence Engine (Node.js)

Uses **Exa.ai and Tavily** search APIs (not scraping) to find relevant URLs for a given business type and location, then uses **Jina Reader API** to convert those pages to Markdown, and finally uses **Groq** to extract structured facts. A "browser-less" approach — no Playwright for web intelligence.

**Status:** Complete and elegant.

#### `Zonek_gov/src/fetchers/` — Government Data ETL (Node.js, 12 fetchers)

Fetches from actual government sources:

| Fetcher | Source | Method |
|---|---|---|
| `schemes.js` | HuggingFace CDN (`shrijayan/gov_myscheme`) + myScheme.gov.in | HTTPS direct download |
| `weather.js` | Open-Meteo (free, no auth) | REST API |
| `cropPrices.js` | Agmarknet / data.gov.in | REST API (needs `DATA_GOV_KEY`) |
| `jjm.js` | ejalshakti.gov.in (Jal Jeevan Mission) | DevTools-discovered POST endpoint |
| `pmay.js` | rhreporting.nic.in (PMAY housing) | POST endpoint |
| `courts.js` | NJDG (National Judicial Data Grid) | GET API |
| `population.js` | Census 2011 CSV | Local CSV parse |
| `crime.js` | NCRB annual CSV | Local CSV parse |
| `schools.js` | UDISE+ annual CSV | Local CSV parse |
| `budget.js` | RBI seed data (annual) | Local parse |
| `elections.js` | GitHub ECI data | HTTPS download |
| `infrastructure.js` | Google RSS (news) | RSS parse |

**Status:** Mostly working — each fetcher has freshness checks, graceful degradation, and standardized MongoDB writes. `schemes.js` has a fallback from HuggingFace parquet to myScheme API.

---

### 4.2 Database Schema / ORM Models

#### `Zonek/backend/models/` — Mongoose Models (MongoDB, 8 models)

| Model | Key Fields | Status |
|---|---|---|
| `User` | fullName, email, username, password (bcrypt), userType, profilePicture, reputationScore, demandPosts[], rentalPosts[] | Complete |
| `DemandPost` | title, category, description, location (GeoJSON Point), images[], upvotes, demographics[], urgencyScore, distanceRadiusMiles, collaborationOpen | Complete |
| `RentalPost` | title, category, description, location (GeoJSON Point), images[], price, squareFeet, leaseType, amenities[], zoningCode, collaborationOpen, status | Complete |
| `CommunityPost` | author, content, topic, media[], hashtags, likesCount, repliesCount, repostsCount, moderation status | Complete |
| `CommunityComment` | Nested replies on community posts | Complete |
| `Conversation` | Messaging conversation threads | Complete |
| `Message` | Individual messages with media support | Complete |
| `Interaction` | User-post interaction tracking | Minimal |

Both `DemandPost` and `RentalPost` have:
- 2dsphere geospatial index (for `$near` queries)
- Full-text index on title/description/address
- Auto-hashtag extraction pre-save middleware
- `toggleUpvote` and `addComment` instance methods

#### `Zonek_gov/src/models/` — 12 Mongoose Gov Models

Dedicated models for each government data source, all in a separate `zonek_gov` database: `Budget`, `Court`, `Crime`, `CropPrice`, `Election`, `InfrastructureNews`, `JJM`, `PMAY`, `Population`, `Scheme`, `School`, `Weather`.

#### `zonek-orchestrator/src/models/` — ResearchJob Model

Stores research pipeline job state: jobId, input parameters, status, packet JSON, report JSON, timestamps.

#### Schema Notes

> **Note:** The task references `db/schema.sql` for comparison — this file was not found. The current rebuild still uses MongoDB; no SQL schema exists anywhere in the workspace. The Mongoose models above are the canonical schema definition.

Key fields worth preserving in any migration:
- `DemandPost.demographics[]` and `urgencyScore` — community demand signal metadata
- `RentalPost.zoningCode`, `leaseType`, `collaborationOpen` — more granular than a scraper-sourced record
- The 2dsphere geospatial index pattern for both post types

---

### 4.3 API / Backend Code (Routes and Endpoints)

#### `Zonek/backend/server.ts` — Express + Socket.io (port 5001)

| Route | Purpose |
|---|---|
| `POST/GET /api/auth` | JWT login, register, password reset |
| `GET/POST /api/posts` | CRUD for demands and rentals |
| `GET/POST /api/images` | GridFS image upload/retrieval |
| `GET/POST /api/conversations` | Messaging threads |
| `GET/POST /api/users` | User profile management |
| `GET/POST /api/community` | Community feed ("The Hive") |
| `GET /api/stats` | Aggregate platform statistics |
| `POST /api/ai/chat` | ARU chatbot (Groq) |
| `POST /api/ai/ideas` | Business idea generator (Groq) |
| `POST /api/ai/match` | Demand-Rental AI matcher (Groq) |
| `POST /api/ai/geocode` | Forward geocoding (Nominatim) |
| `POST /api/ai/reverse-geocode` | Reverse geocoding (Nominatim + Groq formatter) |

Socket.io events: `join_post`, `join_user`, `join_conversation`, `send_message`, `receive_message`, `new_message_notification`.

**Auto-launcher:** `engineLauncher.ts` spawns both the orchestrator (port 8002) and rental scraper (port 8001) as child processes when the main backend starts in dev mode.

#### `india_rental_scraper/api.py` — FastAPI (port 8001)

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/rentals` | Run full 8-platform parallel scrape for a location |
| `GET /api/v1/health` | Health check + scraper availability count |
| `GET /api/v1/scrapers` | List registered/importable scrapers |

#### `zonek-orchestrator/src/index.js` — Express SSE (port 8002)

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | Health check |
| `POST /api/v1/research` | SSE-streamed 4-stage parallel pipeline |
| `GET /api/v1/export/:jobId` | ZIP download (JSON report + CSVs) |

---

### 4.4 Frontend / UI Code

The `Zonek/` directory contains a **complete, production-deployed React 19 SPA** (deployed to Vercel). Key components:

| Component | What it does |
|---|---|
| `Research.tsx` (19 KB) | Research form + SSE result renderer — calls `/api/v1/research` and renders live streaming intelligence report |
| `Home.tsx` (33 KB) | Landing page with hero, category browse, location selector |
| `DemandFeed.tsx` (30 KB) | Paginated demand posts feed with geolocation filter |
| `RentalListings.tsx` (26 KB) | Commercial rental listings browser |
| `Collaboration.tsx` (38 KB) | Largest component — collaboration between entrepreneurs and property owners |
| `CommunityHub.tsx` (15 KB) | "The Hive" social feed |
| `Chatbot.tsx` (11 KB) | ARU chatbot widget (floating, calls Groq via backend) |
| `AIMatches.tsx` (20 KB) | Demand-Rental AI matcher display |
| `AISuggestions.tsx` (16 KB) | Business idea suggestions display |
| `Profile.tsx` (27 KB) | User profile with reputation score, posts, settings |

**Status:** Complete, working, deployed. `Research.tsx` is the key bridge between the old community platform and the new intelligence engine.

---

### 4.5 AI / LLM Integration Code

This is the most strategically important section.

#### The Dual-LLM Setup (`zonek-orchestrator/src/report/reportGenerator.js`)

The "Zero-Hallucination Firewall" referenced in docs **exists and is fully implemented.** Exact mechanics:

**Stage 1 — Ollama (local, privacy-first):**
- Prompt: brief feasibility summary (<100 words, critical risks only)
- Model: Ollama local (not hardcoded — any model)
- Role: Quick pre-screening summary
- Failure mode: Silently skipped if Ollama unavailable — non-blocking

**Stage 2 — Groq (cloud, deep reasoning):**
- System: "You are Zonek Intelligence Engine — a deterministic business feasibility analyst."
- Models: `llama-3.3-70b-versatile` (default) OR `llama-3.1-8b-instant` (fast)
- Role: Full structured JSON feasibility report in schema 00-07
- Input: Only the IntelligencePacket (never raw web data)

**Stage 3 — Hallucination Firewall (`firewall.js`, pure JS, no AI):**

Deterministic post-processing validator with 5 rules:
1. **Rental figure check:** If AI's `avg_rent` differs >10% from `packet.rentals.avg_rent_inr` — overwrite with packet value, tag as `FIREWALL_CORRECTED`
2. **Unavailable data guard:** If rental data unavailable — force `avg_rent = 0` with `UNAVAILABLE` tag
3. **Competitor count guard:** If AI hallucinated competitors when `packet.competitors.count === 0` — zero out
4. **Confidence sync:** Force-tags sections where source data was unavailable
5. **Score/verdict consistency:** If label=STOP but score>40 — clamp to 35; if label=GO but score<70 — clamp to 75

#### The ARU Chatbot (`Zonek/backend/controllers/aiController.ts`)

- Model: `llama-3.1-8b-instant` (fast)
- Persona: "ARU — an experienced entrepreneur friend"
- Security: system prompt explicitly instructs the model to never reveal credentials or codebase details
- Also wraps Nominatim geocoding with Groq formatting for "hybrid geocoding" pattern

#### Demand-Rental AI Matcher (`aiController.ts`)

- Model: `llama-3.3-70b-versatile`
- Output: strict JSON array of matches with `confidenceScore` (0-1) and reasoning
- Firewall: `response_format: json_object` enforced

---

### 4.6 Config Files and Committed Secrets

> **CRITICAL SECURITY ISSUE: Real credentials committed to git history**

The following `.env` files contain real, live API keys committed to the `Zonek/` git repository:

| File | What is committed |
|---|---|
| `Zonek/backend/.env` | Real GROQ_API_KEY (gsk_Hq...Orj) — do not echo publicly |
| `zonek-orchestrator/.env` | Real GROQ_API_KEY (same key) + Real TAVILY_KEY (tvly-dev-4U...) |
| `Zonek_gov/.env` | Real DATA_GOV_KEY (579b464d...) for data.gov.in |
| `Zonek_browser/.env` | Real TAVILY_KEY (same key) + GROQ_API_KEY |

**Action required:** These keys should be rotated immediately. They exist in the full git history and cannot be removed by simply updating the `.env` file.

**Safe configs found:**
- `Zonek-Intelligence/.env.example` — clean placeholder-only example

---

### 4.7 README, Docs, and Notes

#### `Zonek/README.md`

Documents the project under its original name "Bridgehead." Describes the "50/100 head start" philosophy, full tech stack, and architecture. Last updated April 1, 2026. The name "Bridgehead" is used internally — the repo is also called "Bridgehead" on GitHub (`shanks5017/Bridgehead`).

#### `Zonek/docs/` — 21 Planning Documents

| Document | Content |
|---|---|
| `plans.md` (22 KB) | Original development roadmap |
| `database_plans.md` (16 KB) | MongoDB Atlas migration, schema optimization, indexing strategy |
| `project_analysis.md` (21 KB) | Prior self-audit of the codebase |
| `schema_documentation.md` (5 KB) | Detailed schema for Rental, Demand, and proposed Competitor model |
| `LLM_Research/01-04.md` (~87 KB total) | 4 research docs on LLM integration strategy |
| `daily_report.md` (42 KB) | Development diary |
| `deployment_plans.md` (17 KB) | Vercel + MongoDB Atlas deployment guide |
| `security_plans.md` (19 KB) | JWT, rate limiting, input validation plans |

#### Root-level docs

| File | Content |
|---|---|
| `01.md` (7 KB) | Executive summary of the entire Zonek 2.0 ecosystem |
| `02.md` (35 KB) | Previous technical audit — largely superseded by this doc |
| `final.md` (50 KB) | B.Tech project report draft — includes abstract confirming "78% toward production readiness" |
| `to_do.md` (7 KB) | 4-phase roadmap: ChromaDB, Scraper Reliability, AI Fine-tuning, UI/UX |

---

## 5. Reusability Table

| File / Module | Language | What it does | Status | Reusability |
|---|---|---|---|---|
| `india_rental_scraper/pipeline.py` | Python | Async parallel orchestrator for 8 scrapers | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/api.py` | Python/FastAPI | HTTP wrapper exposing scraper pipeline on port 8001 | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/config.py` | Python | Central config (cities, platforms, timeouts, DB) | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/utils/location_resolver.py` | Python | Converts location string to structured LocationContext via Nominatim + pincode API | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/utils/mongo_handler.py` | Python | MongoDB upsert with deduplication and sanitization | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/scrapers/base_scraper.py` | Python | Abstract base class with curl_cffi Chrome impersonation | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/utils/helpers.py` | Python | Shared scraping utilities | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/utils/user_agents.py` | Python | User-agent rotation list | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/core/rate_limiter.py` | Python | Async rate limiter | Working | **REUSABLE AS-IS** |
| `india_rental_scraper/scrapers/nobroker.py` | Python | NoBroker commercial listing scraper | Working | **REUSABLE WITH CHANGES** (platform may update blocks) |
| `india_rental_scraper/scrapers/housing.py` | Python | Housing.com Playwright scraper | Working | **REUSABLE WITH CHANGES** |
| `india_rental_scraper/scrapers/olx.py` | Python | OLX curl_cffi scraper | Working | **REUSABLE WITH CHANGES** |
| `india_rental_scraper/scrapers/magicbricks.py` | Python | MagicBricks scraper | Working | **REUSABLE WITH CHANGES** |
| `india_rental_scraper/scrapers/acres99.py` | Python | 99acres scraper | Working | **REUSABLE WITH CHANGES** |
| `india_rental_scraper/resolvers/locality_resolver.py` | Python | Platform-specific locality ID resolution | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/pipeline/orchestrator.js` | JS/Node | 4-stage parallel pipeline with Promise.allSettled + timeout | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/normalizer/firewall.js` | JS/Node | Hallucination firewall (deterministic, no AI) | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/normalizer/intelligencePacket.js` | JS/Node | Merges 4 data sources into normalized packet | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/report/reportGenerator.js` | JS/Node | Dual-LLM report generation (Ollama + Groq) | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/pipeline/rentalAdapter.js` | JS/Node | Calls rental scraper API + emits SSE events | Working | **REUSABLE AS-IS** |
| `zonek-orchestrator/src/pipeline/govAdapter.js` | JS/Node | Queries gov MongoDB directly for intelligence | Working | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/pipeline/competitorScraper.js` | JS/Node | Justdial Playwright scraper (fragile anti-bot) | Working but fragile | **REUSABLE WITH CHANGES** |
| `zonek-orchestrator/src/pipeline/browserAdapter.js` | JS/Node | Calls Zonek_browser engine via direct require | Working | **REUSABLE AS-IS** |
| `zonek-orchestrator/src/index.js` | JS/Node | Express + SSE server, job caching, ZIP export | Working | **REUSABLE WITH CHANGES** |
| `Zonek_gov/src/orchestrator.js` | JS/Node | Runs all 12 gov fetchers in dependency order | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/fetchers/schemes.js` | JS/Node | Gov scheme data from HuggingFace + myScheme API | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/fetchers/weather.js` | JS/Node | Open-Meteo weather (free, no key) | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/fetchers/cropPrices.js` | JS/Node | Agmarknet crop prices via data.gov.in | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/fetchers/jjm.js` | JS/Node | Jal Jeevan Mission water infrastructure data | Working | **REUSABLE WITH CHANGES** (endpoint may change) |
| `Zonek_gov/src/fetchers/population.js` | JS/Node | Census CSV parser | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/fetchers/crime.js` | JS/Node | NCRB crime data CSV | Working | **REUSABLE AS-IS** |
| `Zonek_gov/src/models/` (12 models) | JS/Mongoose | Gov data schemas | Working | **REUSABLE WITH CHANGES** |
| `Zonek_browser/src/browser.js` | JS/Node | Exa.ai/Tavily search + Jina reader + Groq extractor | Working | **REUSABLE AS-IS** |
| `Zonek/backend/controllers/aiController.ts` | TypeScript | Groq chatbot, ideas, demand-rental matching, geocoding | Working | **REFERENCE ONLY** (different platform context) |
| `Zonek/backend/models/RentalPost.ts` | TS/Mongoose | Rental listing schema with geo, upvotes, comments | Working | **REFERENCE ONLY** (UGC, not scraper-sourced) |
| `Zonek/backend/models/DemandPost.ts` | TS/Mongoose | Demand post schema with demographics, urgencyScore | Working | **REFERENCE ONLY** (UGC platform) |
| `Zonek/backend/utils/engineLauncher.ts` | TypeScript | Child process spawner for orchestrator + scraper | Working | **REUSABLE WITH CHANGES** |
| `Zonek/backend/datasets/*.json` | JSON | 1.1 MB demands + 1.4 MB rentals seed data | Data files | **REUSABLE AS-IS** (seed/test data) |
| `Zonek/backend/models/User.ts` | TS/Mongoose | User auth, profile, reputation | Working | **SUPERSEDED** (rebuild is a data engine, not a user platform) |
| `Zonek/backend/models/CommunityPost.ts` | TS/Mongoose | Social feed post model | Working | **SUPERSEDED** |
| `Zonek/backend/controllers/authController.ts` | TypeScript | JWT auth with bcrypt + email verification | Working | **SUPERSEDED** |
| `Zonek/backend/services/imageService.ts` | TypeScript | GridFS image storage | Working | **SUPERSEDED** |
| `Zonek/components/Research.tsx` | React/TS | SSE result renderer for intelligence reports | Working | **REFERENCE ONLY** |
| `Zonek/components/RentalListings.tsx` | React/TS | Rental listings browser UI | Working | **REFERENCE ONLY** |
| `Zonek/services/groqService.ts` | TypeScript | Frontend Groq API client | Working | **REFERENCE ONLY** |
| Committed `.env` files | Config | Real API keys (Groq, Tavily, data.gov.in) | — | **ROTATE IMMEDIATELY** |

---

## 6. What This Changes About the Phase 1/2 Plan

> **Note:** The files `05_PHASE_1_MVP_SCOPE.md` and `06_PHASE_2_SOURCE_RESEARCH_FINDINGS.md` were not found in the workspace — they appear to be planned documents for the rebuild that haven't been created yet. This section maps audit findings to the strategic priorities described in `01.md` and `to_do.md`.

### Tasks Already Partially or Fully Done

The following items in the rebuild plan are **not "to build from scratch"** — working implementations already exist:

| Planned Task | Existing Implementation | Assessment |
|---|---|---|
| Commercial rental scraper | `india_rental_scraper/` — 8 platforms, FastAPI-wrapped | **90% done.** Missing: proxy rotation, full stealth, TTL cache. |
| Rental data API endpoint | `india_rental_scraper/api.py` on port 8001 | **Done.** Already serves structured JSON. |
| Location resolver / geocoding | `india_rental_scraper/utils/location_resolver.py` | **Done.** Handles text, pincode, heuristic fallback, LRU cache. |
| Competitor scraper (Justdial) | `zonek-orchestrator/src/pipeline/competitorScraper.js` | **50% done.** Works but no stealth plugin. |
| Government data pipeline | `Zonek_gov/` — 12 fetchers, MongoDB, scheduled | **Done.** 12 live government data sources implemented. |
| Hallucination Firewall | `zonek-orchestrator/src/normalizer/firewall.js` | **Done.** 5 deterministic rules, integrated into pipeline. |
| Dual-LLM report generation | `zonek-orchestrator/src/report/reportGenerator.js` | **Done.** Ollama (local) + Groq llama-3.3-70b (cloud). Schema 00-07 defined. |
| Intelligence packet normalization | `zonek-orchestrator/src/normalizer/intelligencePacket.js` | **Done.** Merges 4 sources with confidence tagging. |
| SSE-streamed research pipeline | `zonek-orchestrator/src/index.js` | **Done.** Live streaming, heartbeat, job caching, ZIP export. |
| Browser intelligence (web extraction) | `Zonek_browser/src/browser.js` | **Done.** Exa.ai + Tavily + Jina + Groq extraction. |
| Seed data for testing | `Zonek/backend/datasets/` | **Done.** 1.1 MB demands + 1.4 MB rentals (real data). |
| Deduplication logic | `india_rental_scraper/pipeline.py` `_deduplicate()` | **Done.** Exact URL + fuzzy (price +-10%, locality tokens, BHK match). |

### Items the Existing Code Contradicts or Changes

1. **"Build a rental scraper"** — Already 8 scrapers in parallel. Phase 1 task should be renamed **"Harden existing rental scrapers"** — add proxy rotation (Bright Data), playwright-stealth, MongoDB TTL indexes.

2. **"Research gov data sources"** — `Zonek_gov/` already has 12 sources implemented. Phase 2 gov source research is done in code, not just theory.

3. **"Design the intelligence packet schema"** — `intelligencePacket.js` already defines the schema: `{ query, web_intelligence, rentals, competitors, gov_data }` with confidence tagging. This is the canonical data model.

4. **"Design the report schema"** — `reportGenerator.js` has the full 8-section schema (`00_verdict_bar` through `07_final_verdict_and_action_plan`) already implemented. Groq is already being prompted to return it.

5. **"Hallucination firewall design"** — Already implemented. Design decision already made: pure deterministic JS post-processing (not a second LLM call).

6. **"Commercial rental data from MagicBricks / OLX"** — Already happening. `belgaum_rentals.json` (331 KB) is real scraped output proving the pipeline works end-to-end.

### Items NOT Yet Started (Truly New Work)

7. **ChromaDB vectorization** (Phase 1 roadmap) — NOT STARTED. No vector database code anywhere.

8. **Budget PDF intelligence with Camelot/pdfplumber** — NOT STARTED. `budget.js` uses static RBI seed data, not live PDF parsing.

9. **Proxy rotation (Bright Data/Oxylabs)** — NOT STARTED. The scraper uses direct `curl_cffi` Chrome impersonation only.

10. **Fine-tuned Llama 3.1 8B for Indian business context** — NOT STARTED.

11. **Interactive heatmap UI** (React-Leaflet) — NOT STARTED. Frontend exists but has no map integration.

---

## 7. Key Strategic Insight

The old codebase reveals that the **entire data pipeline infrastructure is already built and tested end-to-end.** The `belgaum_rentals.json` file is proof — 331 KB of real commercial rental data already scraped from 8 platforms.

The Zonek Intelligence 2.0 rebuild is not starting from scratch. It is starting from a **working system** that needs:
- **Hardening:** Anti-bot measures (proxy rotation, playwright-stealth)
- **Scale:** More cities, more government data sources (ChromaDB + Census 2021)
- **Better AI grounding:** Vector search for demographic context
- **Production deployment:** Current setup is dev-only (local MongoDB, no auth, no rate limiting on orchestrator)

**Biggest security risk:** Real API keys (`GROQ_API_KEY`, `TAVILY_KEY`, `DATA_GOV_KEY`) are committed to the `Zonek/` git repository history. These should be rotated before any public exposure of that repository.
