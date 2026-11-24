# 📚 Zonek Documentation Hub — Architecture, Plans & Specifications

> **Target Release:** Version 3.0  
> **Status:** Production Sprint (Nov 24 – Dec 14, 2026 | Beta: Dec 15, 2026 | Launch: Jan 2027)

---

## 1. Master System Alignment

This document updates and unifies all planning and technical documentation inside `Zonek/docs/` to reflect the active production architecture.

### What Actually Exists Today in `Zonek/`:
- **Full-Stack Monorepo:** React 19 + TypeScript + Vite frontend paired with a Node.js + Express backend on Port 5001.
- **Relational Data & Auth:** Supabase PostgreSQL with `gov_schemes`, `gov_districts`, `rental_posts`, `demand_posts`, `auth.users`, and `profiles`.
- **Primary AI Reasoning Engine:** Groq Cloud SDK running `openai/gpt-oss-120b` (120-billion parameter reasoning model, sub-4s response per section) with constrained fallback to `qwen/qwen3.8-27b`.
- **Feasibility Engine (`businessResearchController.ts`):** Produces realistic, non-zero line-item budgets, authentic local competitors, unit economics, and 90-day execution roadmaps.

### What Happens Next (The 20-Day Build & Beta Sprint):
1. **5-Tab Sub-Navbar Modularization:** Split monolithic `BusinessResearch.tsx` into 5 clean, focused tab components.
2. **Dual-State Founder Command Dashboard:** First-time user launchpad transitioning into an active 90-day launch command center with checkable sprint tasks.
3. **1-Click Investor PDF Engine:** Client/Server print-styled PDF download suitable for bank loans and landlord lease reviews.
4. **Demand-to-Research Link:** 1-Click *"Analyze This Opportunity"* CTA on community demand cards.
5. **AI Idea Generator:** Cross-referencing local unmet demand signals with founder budgets.
6. **Lightweight Community & Direct Messaging:** Supabase-powered founder discussion board and 1-on-1 direct inquiry chat.

---

## 2. Directory Index & Modern Status Mapping

| Old File in `Zonek/docs/` | Original Concept (Legacy) | Modern Reality (v3.0 Production) | What Happens Next |
|---|---|---|---|
| `plans.md` | Legacy Python/Ollama backend planning | Express TypeScript backend on Port 5001 + Groq `openai/gpt-oss-120b` + Supabase. | Follow `checklist.md` for the 20-day sprint schedule. |
| `database_plans.md` / `MONGODB_ATLAS_SETUP.md` | MongoDB Atlas document database | Supabase PostgreSQL with relational schemas and RLS. | Add `research_reports`, `community_posts`, and `network_messages` tables. |
| `scrapper.md` | Standalone Python crawlers | Decoupled `Zonek-Machine` microservices (`rental-scraper`, `gov-data`, `browser-intel`, `orchestrator`). | Add 3–5s timeouts and pre-seed flagship hubs (Bangalore, Mumbai, Delhi-NCR). |
| `ai_enhancement_plans.md` | Llama 3 8B / 70B & Qwen 2.5 local fine-tuning | Groq Cloud `openai/gpt-oss-120b` primary model with 120B reasoning tokens. | Add token burn tracking per report and response caching. |
| `ui_ux_plans.md` | Legacy brutalist pages | Clean Neo-Brutalist design system with high executive hierarchy and 5-Tab Sub-Navbar. | Build modular tab components under `Zonek/components/research/`. |
| `features_plans.md` | Generic feature roadmap | The 8 Core Pillars (Dashboard, Research, Demands, Rentals, Gov Data, Ideas, Community, Network). | Implement the 8 pillars according to the 20-day sprint checklist. |
| `architecture_and_flow.md` | Monolithic flow diagram | SSE streaming research engine with live terminal status updates. | Connect frontend SSE reader to the new 5-tab sub-navbar. |
| `DEMAND_POSTING_GUIDE.md` | Standalone demand posting rules | Demands Marketplace integrated directly into the Feasibility Research Engine. | Add *"Analyze This Opportunity"* button to every demand card. |

---

## 3. The 8 Core Pillars — Code-Level Mapping

```
Zonek/
├── components/
│   ├── Dashboard.tsx                 # [Pillar 1] Founder Command Dashboard
│   ├── research/                     # [Pillar 2] Feasibility Research Engine
│   │   ├── ResearchSubNavbar.tsx     # Sticky Sub-Navbar
│   │   ├── ExecutiveOverviewTab.tsx  # Tab 1: Verdict, Seasonality, Validation Days
│   │   ├── LocationRentalsTab.tsx    # Tab 2: Zoning, Active Rentals, Rent/sqft
│   │   ├── CompetitorLongevityTab.tsx# Tab 3: Verified Competitor Matrix & Survival
│   │   ├── FinancialBlueprintTab.tsx # Tab 4: Itemized Budget, Unit Econ, 12m P&L
│   │   ├── GovSchemesComplianceTab.tsx # Tab 5: Mudra/PMEGP, Required Licenses
│   │   └── ResearchTerminal.tsx      # Real-time research activity terminal
│   ├── Demands.tsx                   # [Pillar 3] Demands Marketplace + 1-Click CTA
│   ├── Rentals.tsx                   # [Pillar 4] Commercial Properties Marketplace
│   ├── GovData.tsx                   # [Pillar 5] "For The People" Civic Portal
│   ├── IdeaGenerator.tsx             # [Pillar 6] Demand-Backed AI Idea Generator
│   ├── Community.tsx                 # [Pillar 7] Founder Discussion Board
│   ├── NetworkChat.tsx               # [Pillar 8] 1-on-1 Direct Messaging
│   └── Sidebar.tsx                   # Clean 8-Pillar Navigation Bar
```
