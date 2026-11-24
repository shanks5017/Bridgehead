# Zonek / Bridgehead — Master Documentation & Architectural Blueprint

> **Status:** Active Production Sprint  
> **Sprint Target:** Nov 24 – Dec 14, 2026 (Beta: Dec 15, 2026 | Launch: Jan 2027)  
> **Source Documents:** Synthesized from `01_Executive_Decisions` through `09_Technology_Risks_Decisions`.

---

## 1. Executive Summary & Product Ground Truth

### What Actually Exists Today:
- **Core Engine:** A high-speed, zero-hallucination feasibility analysis engine in `Zonek/backend/controllers/businessResearchController.ts` powered by Groq `openai/gpt-oss-120b` (120B parameter model) delivering full business feasibility reports in 2–4 seconds per section.
- **Relational Data Foundation:** Supabase PostgreSQL with active tables for `gov_schemes`, `gov_districts`, `gov_weather`, `rental_posts`, and `demand_posts`.
- **Frontend Prototype:** React 19 + TypeScript + Vite frontend with Neo-Brutalist styling, 5-step dynamic intake questionnaire, and rich visual data cards.
- **Microservices Engine (`Zonek-Machine`):** Dedicated daemons for government data harvesting (`gov-data`), deep web intelligence extraction (`browser-intel`), live property scraping (`rental-scraper`), and orchestration (`orchestrator`).

### What Happens Next (The 20-Day Build & Beta Sprint):
1. **Sub-Navbar 5-Tab Overhaul:** Replace the single-page scroll with 5 dedicated tabs:
   - *Tab 1: Overview & Feasibility* (Verdict, Seasonality, Validation Days)
   - *Tab 2: Micro-Location & Rentals* (Active spaces, rent/sqft, demand match)
   - *Tab 3: Competitors & Longevity* (Verified pricing, survival rate, Blue Ocean grid)
   - *Tab 4: Financial Blueprint* (Itemized setup budget, unit economics, 12m P&L)
   - *Tab 5: Gov Schemes & Compliance* (Mudra, PMEGP subsidy claim links, licenses checklist)
2. **Founder Command Dashboard:** Dual-state home screen acting as an active 90-day launch command center with checkable daily sprint tasks and runway/burn tracking.
3. **1-Click Investor PDF Download:** Branded, print-styled PDF report for bank loan applications and landlord lease reviews.
4. **Demand-to-Research Bridge:** "Analyze This Opportunity" 1-click CTA on every community demand card.
5. **Private Beta (Dec 15–25):** 50 free power users in flagship hubs (Bangalore, Mumbai, Delhi-NCR) testing the platform.

---

## 2. Granular Module Breakdown: Existing State vs. Next Steps

### Module 01: Executive Decisions & Feasibility Engine
* **What Exists:**
  - 5-step intake questionnaire (`BusinessResearch.tsx`) capturing business format, budget, location, target persona, and differentiators.
  - LLM pipeline leveraging frameworks: Alex Hormozi ($100M Offers), Peter Thiel (Zero to One monopoly moat), Steve Jobs (One Brilliant Thing), Wondelai (Jobs-To-Be-Done), Corey Haines (StoryBrand & Copywriting), Matt Warren (COO 90-day roadmap).
* **What Happens Next:**
  - Break monolithic 1,100-line `BusinessResearch.tsx` into modular components under `Zonek/components/research/`.
  - Add "Validation Test Window" calculation (exact days needed to pilot/test before signing long-term leases).

### Module 02: Data Machine & Ingestion (`Zonek-Machine`)
* **What Exists:**
  - `gov-data`: Harvesters for weather (OpenMeteo), crop prices (Agmarknet), water infrastructure (JJM), housing (PMAY), and MSME schemes.
  - `rental-scraper`: Python FastAPI scraper targeting OLX and MagicBricks.
  - `browser-intel`: Exa.ai / Tavily search with LLM markdown extractors.
  - `orchestrator`: 15-second parallel execution pipeline coordinator.
* **What Happens Next:**
  - Migrate all outputs directly into Supabase tables instead of legacy MongoDB staging.
  - Add strict 5-second timeouts with local fallback benchmarks so the scraper layer never blocks frontend reports.
  - Pre-seed flagship location caches for Bangalore (Indiranagar, Koramangala, HSR), Mumbai (Bandra, Andheri), and Delhi-NCR (CyberHub, South Delhi).

### Module 03: Storage & Data Models
* **What Exists:**
  - Supabase PostgreSQL schema with tables: `gov_districts`, `gov_weather`, `gov_schemes`, `rental_posts`, `demand_posts`, `auth.users`, `public.profiles`.
  - Automatic profile creation trigger on user signup.
* **What Happens Next:**
  - Add indexes on `location`, `pin_code`, and `category` across `rental_posts` and `demand_posts`.
  - Create `research_reports` table to persist user-generated reports and link them to the Founder Dashboard.
  - Create lightweight tables for `community_posts` and `network_messages`.

### Module 04: AI Reasoning & Evidence Tokens
* **What Exists:**
  - Primary model: `openai/gpt-oss-120b` on Groq (2–4s per section, 120B parameter reasoning tokens).
  - Secondary fallback model: `qwen/qwen3.8-27b` with constrained tokens.
  - Hallucination firewall to sanitize false absolute guarantees.
* **What Happens Next:**
  - Implement token burn tracking per report to calculate exact unit margins before commercial launch.
  - Enable caching of repeated location/category research queries to reduce LLM API costs by up to 60%.

### Module 05: Frontend Pages & User Flows
* **What Exists:**
  - Navigation sidebar with active state management.
  - Views: `BUSINESS_RESEARCH`, `RENTALS`, `DEMANDS`, `GOV_DATA`, `AUTH`.
* **What Happens Next:**
  - Refactor sidebar to the approved 8 Core Pillars:
    1. 🏠 *Dashboard* (Command Center)
    2. 🔬 *Feasibility Research* (5-Tab Sub-Navbar)
    3. 📢 *Demands* (Community business requests)
    4. 🏢 *Commercial Rentals* (Available spaces)
    5. 🏛️ *Gov Data* ("For The People" civic portal)
    6. 💡 *Ideas* (Demand-backed AI idea generator)
    7. 👥 *Community* (Founder discussion forum)
    8. 💬 *Network* (1-on-1 direct messaging)
  - Remove deprecated generic `Feed` page.
  - Implement the *"Taste First, Sign Up to Unlock"* high-conversion onboarding funnel.

### Module 06: Business Model & Monetization
* **What Exists:**
  - Free evaluation tier with instant report streaming.
* **What Happens Next:**
  - Post-Beta Tiering:
    - *Free Tier:* 1 deep report, 1 PDF download, 7-day dashboard tracking, Demand & Rental marketplace.
    - *Premium:* 5 reports/day, 30 days active execution dashboard.
    - *Pro:* Unlimited research, daily ground updates, full community & direct messaging.
  - Beta Phase (Dec 15–25): 100% Free Pro Tier for 50 selected founders in exchange for feedback.

---

## 3. Sprint Master Schedule (Nov 24 – Dec 14, 2026)

- **Week 1 (Nov 24–30):** Sub-Navbar 5-tab modularization, Live Research Status Terminal, 1-Click Investor PDF Engine.
- **Week 2 (Dec 1–7):** Dual-state Founder Dashboard, "Analyze This Opportunity" Demand bridge, AI Idea Generator, Gov Data viewer polish.
- **Week 3 (Dec 8–14):** Lightweight Community forum, Network 1-on-1 direct messaging, Flagship data seeding (Bangalore, Mumbai, Delhi-NCR), end-to-end testing.
- **Week 4 (Dec 15–25):** 50-User Private Beta testing & feedback iteration.
- **Public Launch (Early Jan 2027):** Commercial release.
