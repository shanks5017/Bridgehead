# Zonek / Bridgehead — Master Product Blueprint & 20-Day Launch Checklist

> **Launch Roadmap:**
> - **Product:** Zonek / Bridgehead — Ground-Truth Feasibility & Execution Engine for Entrepreneurs
> - **Build Sprint (15–20 Days):** November 24, 2026 – December 14, 2026
> - **Private Beta (10 Days):** December 15, 2026 – December 25, 2026 (50 Free Beta Users)
> - **Commercial Public Launch:** Early January 2027

---

## 🏛️ Executive Board-Approved Product Architecture

### Core Value Proposition
Zonek bridges the high-risk gap between *having an idea & budget* and *executing safely on the ground*. It combines verified micro-location evidence (commercial rentals, competitor pricing, civic density, government grants) with battle-tested founder frameworks to give entrepreneurs a reliable feasibility verdict, itemized financial model, and day-by-day 90-day launch command center.

---

## 🗺️ The 8 Core Product Pillars (Locked Scope)

| # | Pillar | Description | Status / Target |
|---|---|---|---|
| **1** | **Founder Command Dashboard** | **Home screen & Retention engine.** Dual-state UI:<br>• *New User:* Frictionless launchpad to test business ideas.<br>• *Returning Founder:* Daily Command Center with 90-day countdown, checkable daily tasks, and budget burn meter. | New Build |
| **2** | **Feasibility Research Engine** | **The Brain.** 5-Tab Sub-Navbar layout:<br>• Tab 1: *Executive Feasibility & Timing* (Verdict, Seasonality, Test Days)<br>• Tab 2: *Micro-Location & Rentals* (Active spaces, price/sqft, demand match)<br>• Tab 3: *Competitors & Longevity* (Active vs closed businesses, verified pricing)<br>• Tab 4: *Financial Blueprint* (Itemized setup budget, unit economics, 12m P&L)<br>• Tab 5: *Gov Schemes & Compliance* (Mudra/PMEGP subsidies, FSSAI/Trade licenses)<br>+ 1-Click Investor PDF Download. | In Progress (Refactoring from 1-page to 5-Tab Sub-navbar) |
| **3** | **Demands Marketplace** | **Unmet community business requests.** Locals post needs; founders discover high-demand niches with a **1-click "Analyze This Opportunity"** button that pre-populates research. | Integrated |
| **4** | **Commercial Rentals** | **Verified spaces marketplace.** Commercial property listings linked dynamically to feasibility research reports as concrete options. | Integrated |
| **5** | **Gov Data Portal ("For The People")** | **Civic transparency portal.** Public access to district statistics, weather patterns, agricultural mandi pricing, and government subsidy schemes. | Integrated (UI Polish) |
| **6** | **AI Idea Generator** | **Demand-backed business generator.** Enter a city/pin code and budget -> AI generates top 3–5 viable business ideas cross-referenced against real neighborhood unmet demands. | New Build |
| **7** | **Founder Community** | **Lightweight discussion board.** Supabase-backed peer community where founders ask questions, share local vendor reviews, and discuss launch obstacles. | New Build (Lightweight) |
| **8** | **Network Messaging** | **Direct inquiry system.** 1-on-1 direct messaging between founders, commercial landlords, and service providers. | New Build (1-on-1 Direct) |

---

## 💰 Monetization & Tiering Structure

| Tier | Price | Inclusions |
|---|---|---|
| **Free Tier** | ₹0 | 1 Free Deep Research Report, 1 PDF Download, Full Demand & Rental Access, 7-Day Founder Dashboard Tracker. |
| **Premium** | TBD (Post-Beta) | 5 Deep Reports per day, 30-Day Active Execution Dashboard, Priority Rental Inquiries. |
| **Pro** | TBD (Post-Beta) | Unlimited Research & Reports, Automated Daily Ground Intelligence Updates, Full Community & Direct Messaging. |

*(For the 50 Beta Users in December: 100% Free Pro Tier in exchange for structured feedback calls).*

---

## 🎯 Conversion & Funnel Strategy: "Taste First, Sign Up to Unlock"
1. **Zero-Friction Entry:** Visitors enter their Business Idea, Location, and Budget directly on the homepage without upfront login wall.
2. **Live Research Terminal:** Visual real-time terminal showing genuine steps (*"Scanning local rental comparables...", "Cross-referencing state subsidy portals...", "Analyzing local competitor density..."*).
3. **Instant Feasibility Verdict:** Shows the high-level **GO / CAUTION / STOP** verdict and market snapshot immediately.
4. **Sign-up Gate to Unlock:** Prompt to create a free account to unlock the full 5-tab breakdown, itemized financial model, and investor PDF download.
5. **Dashboard Onboarding:** Report automatically binds to their new Founder Dashboard, starting their 90-day launch countdown.

---

## 📍 Geographic Rollout Strategy
- **Flagship Launch Hubs (Deep Ground Seeding):** **Bangalore, Mumbai, Delhi-NCR** (dense competitor matrices, active rental posts, ward-level survival rates).
- **Pan-India Coverage:** Broad central & state government schemes (PMEGP, Mudra, Udyam MSME) and standardized commercial cost benchmarks.

---

## 📅 20-Day Build & Launch Sprint Plan (Nov 24 – Dec 14, 2026)

### Week 1: Architecture Cleanup & Research Engine Overhaul (Nov 24 – Nov 30)
- [x] **Task 1.1:** Audit & remove dead endpoints in `Zonek/backend/routes/`.
- [x] **Task 1.2:** Split monolithic `BusinessResearch.tsx` into clean modular components under `Zonek/components/research/`:
  - `OverviewFeasibilityTab.tsx`
  - `LocationRentalsTab.tsx`
  - `CompetitorsLongevityTab.tsx`
  - `FinancialBlueprintTab.tsx`
  - `GovSchemesComplianceTab.tsx`
- [x] **Task 1.3:** Build the sticky **Sub-Navbar** for tab switching with active state indicators.
- [x] **Task 1.4:** Build the **Live Research Terminal** with realistic status steps to show deep, grounded analysis.
- [x] **Task 1.5:** Implement the **1-Click Investor PDF Download** engine.

### Week 2: Founder Command Dashboard & "Analyze Demand" Link (Dec 1 – Dec 7)
- [ ] **Task 2.1:** Build the **Dual-State Founder Dashboard** (`Zonek/components/Dashboard.tsx`):
  - *State A:* First-time user launchpad.
  - *State B:* Active 90-day execution command center with checkable tasks and budget burn meter.
- [ ] **Task 2.2:** Connect Demands to Research: Add **"Analyze This Opportunity"** button to every demand card in `Demands.tsx`.
- [ ] **Task 2.3:** Polish the **Gov Data ("For The People")** civic transparency viewer.
- [ ] **Task 2.4:** Build the **AI Idea Generator** based on neighborhood demand signals.

### Week 3: Lightweight Community, Network Messaging & Beta Hardening (Dec 8 – Dec 14)
- [ ] **Task 3.1:** Create lightweight **Founder Community Board** on Supabase (questions, categories, replies).
- [ ] **Task 3.2:** Create **Direct Inquiry / Network Chat** on Supabase (1-on-1 messaging thread between user and landlord/founder).
- [ ] **Task 3.3:** Remove standalone generic `Feed` page and clean up Sidebar navigation to reflect the 8 pillars.
- [ ] **Task 3.4:** Seed flagship ground data for Bangalore, Mumbai, and Delhi-NCR.
- [ ] **Task 3.5:** End-to-end integration testing, mobile responsiveness, and zero-hallucination verification.

### Week 4: Private Beta Testing (Dec 15 – Dec 25, 2026)
- [ ] Onboard 50 free beta founders (25 F&B/Retail + 25 Service/D2C).
- [ ] Monitor error logs, LLM token burn costs per report, and PDF generation reliability.
- [ ] Conduct feedback calls and push final stability polish for January 2027 commercial launch.
