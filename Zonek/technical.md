# Technical Architecture: Zonek (Bridgehead) Platform

> **Target Release:** Version 3.0  
> **Status:** Active Production Sprint  
> **Sprint Dates:** Nov 24, 2026 – Dec 14, 2026 (Beta: Dec 15, 2026 | Launch: Jan 2027)

---

## 1. System Overview

Zonek is an enterprise-grade market intelligence and business execution platform. It transforms raw micro-location data into validated business feasibility reports, itemized financial models, and actionable 90-day execution playbooks for founders.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom Neo-Brutalist design tokens
- **Build Tool**: Vite (sub-10s production builds)
- **State Management**: React Hooks & Context API
- **Icons**: Lucide React
- **PDF Engine**: Client/Server styled document exporter

### Backend
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript (strict typechecking with `tsc`)
- **API Architecture**: REST endpoints + Server-Sent Events (SSE) for real-time research streaming
- **Database**: Supabase (PostgreSQL)
  - Tables: `auth.users`, `public.profiles`, `rental_posts`, `demand_posts`, `gov_schemes`, `gov_districts`, `gov_weather`, `gov_crop_prices`, `gov_infrastructure_news`
  - Client: `@supabase/supabase-js` with service role key for backend operations
- **Security & Validation**: JWT verification, schema sanitization, express-validator

### AI & Reasoning Engine
- **Provider**: Groq Cloud SDK
- **Primary Model**: `openai/gpt-oss-120b`
  - 120-billion parameter reasoning model
  - Latency: 2–4 seconds per section
  - Output: Strict JSON schemas with internal reasoning tokens
- **Secondary Fallback Model**: `qwen/qwen3.8-27b` (with constrained max_tokens for zero 429 throttling)
- **Data Firewall**: Zero-hallucination validation layer enforcing citation of real local numbers and grounding estimates against location benchmarks.

---

## 3. Data Flow & Research Architecture

```
User Input (Idea, City, Budget, Format)
                  │
                  ▼
         [Frontend Form]
                  │
                  ▼ SSE Stream Request (POST /api/business-research/full-report)
   ┌──────────────────────────────┐
   │  Backend Research Controller │
   └──────────────┬───────────────┘
                  │
        ┌─────────┴────────────────────────┐
        ▼                                  ▼
[Supabase Database]              [External Web Signals]
- gov_schemes (Subsidies)        - Local competitor directories
- gov_districts (Zoning)         - Active rental listings
- rental_posts & demand_posts    - Commercial benchmarks
        └─────────┬────────────────────────┘
                  │
                  ▼
         [Evidence Packet]
                  │
                  ▼
       [Groq 120B Reasoning Engine]
       ├── Tab 1: Executive Feasibility & Timing (GO/CAUTION, Test Days)
       ├── Tab 2: Location & Commercial Rentals (Zoning, Rent/sqft)
       ├── Tab 3: Competitor Matrix & Longevity (Pricing tiers, Survival rates)
       ├── Tab 4: Financial Blueprint (Itemized setup, Unit economics, 12m P&L)
       └── Tab 5: Gov Subsidies & Compliance (PMEGP, Mudra, FSSAI/Trade license)
                  │
                  ▼
       [Hallucination Firewall]
                  │
                  ▼ SSE Event Stream (JSON)
        [5-Tab Sub-Navbar Dashboard] ──> [1-Click Investor PDF Download]
                  │
                  ▼
      [Founder Command Center] (Daily 90-day execution checklist & countdown)
```

---

## 4. API Specification

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | User registration with Supabase auth and profile fallback |
| `/api/auth/login` | `POST` | JWT login token generation |
| `/api/business-research/full-report` | `POST` | Complete 5-tab SSE streaming research engine |
| `/api/business-research/business-plan` | `POST` | Modal quick-scan for Executive Feasibility |
| `/api/business-research/financial-projections` | `POST` | On-demand financial modeling |
| `/api/business-research/competitive-analysis` | `POST` | Local competitor matrix & pricing tiers |
| `/api/business-research/marketing-strategy` | `POST` | StoryBrand script & acquisition channels |
| `/api/business-research/roadmap` | `POST` | 90-day sprint breakdown & operational SOPs |
| `/api/gov/summary` | `GET` | District-level civic intelligence & weather |
| `/api/gov/schemes` | `GET` | Central and state MSME subsidies |

---

## 5. Security & Secret Management

- `SUPABASE_SERVICE_ROLE_KEY` & `GROQ_API_KEY` are stored strictly in `Zonek/backend/.env`.
- `.env` files are verified and excluded via `.gitignore`.
- Database access adheres to schema separation (`public` vs `auth`).
