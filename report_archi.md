# Zonek (Bridgehead) — Master Architecture & System Report

> **Lead Architect:** Updated November 24, 2026  
> **Status:** Architecture Blueprint for Production Launch (Jan 2027)

---

## 1. Complete System Architecture

Zonek operates on a multi-tier, zero-hallucination architecture:

1. **Client Tier (Top):** React 19 + TypeScript frontend featuring the Founder Command Dashboard, 5-Tab Sub-Navbar Research Engine, Demands, Rentals, Gov Data, and AI Idea Generator.
2. **Application Tier (Middle):** Node.js + Express backend (Port 5001) managing JWT authentication, Server-Sent Events (SSE) streaming, hallucination firewalling, and AI model orchestration.
3. **Reasoning Tier:** Primary `openai/gpt-oss-120b` reasoning model on Groq providing 120-billion parameter depth in 2–4 seconds per section, with automatic fallback to `qwen/qwen3.8-27b`.
4. **Data Tier (Bottom):** Supabase PostgreSQL storing relational civic datasets, MSME subsidy schemes, active rentals, demand signals, user profiles, and saved reports.
5. **Extraction Daemons (`Zonek-Machine`):** Autonomous background services for live property scraping (Python/FastAPI), government data ingestion (Agmarknet, OpenMeteo, JJM), and web intelligence (Exa/Tavily).

---

## 2. The 8 Core Pillars Architecture

```
                                 [FOUNDER ENTRY]
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
             [New User Launchpad]           [Returning Founder Command Center]
             - Instant Feasibility Intake   - 90-Day Launch Countdown
             - Live Research Terminal       - Daily Checkable Sprint Tasks
             - "Taste First" Preview Gate   - Capital Spent vs Runway Meter
                       │                                 │
                       └────────────────┬────────────────┘
                                        │
                                        ▼
                   [5-TAB FEASIBILITY RESEARCH ENGINE]
       ┌───────────────────┬───────────────────┬───────────────────┐
       ▼                   ▼                   ▼                   ▼
 [Tab 1: Overview]   [Tab 2: Location]   [Tab 3: Competition] [Tab 4: Financials] [Tab 5: Gov Schemes]
 - Verdict (GO/STOP) - Active Rentals    - Longevity/Survival - Itemized Setup    - Mudra / PMEGP
 - Seasonality       - Price / sqft      - Verified Pricing   - Unit Economics    - FSSAI / Trade
 - Days to Validate  - Demand Match      - Blue Ocean Gaps    - 12m P&L Scenarios - Fire NOC / GST
       └───────────────────┴───────────────────┴───────────────────┘
                                        │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
         [1-Click Investor PDF Download]     [Auto-Sync to Founder Dashboard]
```

### Marketplace & Community Ecosystem:
- **Demands Marketplace:** Community-submitted unmet business signals with a **1-click "Analyze This Opportunity"** button that pre-populates the research engine.
- **Commercial Rentals:** Property listings dynamically pulled into the *Location & Rentals* report tab as concrete site choices.
- **Gov Data ("For The People"):** Public civic transparency portal for state/central subsidies, weather, and mandi prices.
- **AI Idea Generator:** Generates 3–5 viable business concepts matched to real local unmet demands.
- **Founder Community:** Lightweight Supabase-backed peer discussion forum.
- **Network Direct Messaging:** 1-on-1 direct messaging between founders and commercial landlords.

---

## 3. Technology Stack & Operational Ports

| Service | Technology | Port / Type | Purpose |
|---|---|---|---|
| **Zonek Frontend** | React 19, TypeScript, Tailwind, Vite | `5173` | Core user interface & interactive dashboards |
| **Zonek Backend** | Node.js, Express, TypeScript | `5001` | REST API, SSE streaming, Supabase auth |
| **Database** | Supabase (PostgreSQL) | Cloud | Relational data, RLS, and user authentication |
| **AI Reasoning** | Groq (`openai/gpt-oss-120b`) | API | 120B parameter reasoning for financial & strategy models |
| **Orchestrator** | Node.js Express (`Zonek-Machine`) | `8002` | Parallel scraper execution & packet normalization |
| **Rental Scraper** | Python FastAPI (`Zonek-Machine`) | `8000` | MagicBricks & OLX commercial real estate scrapers |
| **Browser Intel** | Node.js (`Zonek-Machine`) | `8003` | Tavily/Exa.ai neural search & markdown fact extractor |
| **Gov Data Engine** | Node.js Daemon (`Zonek-Machine`) | Background | Periodic sync for OpenMeteo, Agmarknet, and JJM |

---

## 4. Next Technical Deliverables (Nov 24 – Dec 14)

1. **Sub-Navbar Component Decomposition:** Refactor monolithic `BusinessResearch.tsx` into 5 standalone tab components under `Zonek/components/research/`.
2. **1-Click Investor PDF Export Engine:** Generate high-resolution, print-ready PDFs directly from research reports.
3. **Founder Command Dashboard:** Build the dual-state dashboard (Launchpad for new visitors, Active Command Center for returning founders).
4. **Demand-to-Research Hook:** Connect `Demands.tsx` to the research engine via the "Analyze This Opportunity" CTA.
5. **Private Beta Launch (Dec 15–25):** Onboard 50 free power users across Bangalore, Mumbai, and Delhi-NCR.
