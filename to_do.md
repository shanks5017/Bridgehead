# 🛠️ Zonek / Bridgehead — 20-Day Actionable Task List

> **Sprint Dates:** November 24, 2026 – December 14, 2026  
> **Beta Launch:** December 15, 2026 (50 Free Power Users)  
> **Commercial Release:** January 2027

---

## 🎯 Phase 1: Sub-Navbar & Report Modularization (Days 1–5)
- [ ] **1.1. Research Tab Modularization:**
  - Create `Zonek/components/research/` folder.
  - Decompose `BusinessResearch.tsx` into:
    - `ExecutiveOverviewTab.tsx` (Verdict, Seasonality, Days to test, One-liner)
    - `LocationRentalsTab.tsx` (Zoning, rental benchmark vs active spaces, demand signals)
    - `CompetitorLongevityTab.tsx` (Verified competitor matrix, longevity/survival rate, Blue Ocean grid)
    - `FinancialBlueprintTab.tsx` (Itemized setup budget, unit economics, 12m P&L, scenarios)
    - `GovSchemesComplianceTab.tsx` (Matched subsidies with application links, statutory licensing checklist)
- [ ] **1.2. Sticky Sub-Navbar Component:**
  - Build navigation bar with active tab highlighting, progress pill, and quick export.
- [ ] **1.3. Live Research Status Terminal:**
  - Enhance streaming UI with real-world research actions (*"Querying Bangalore high-street rental listings...", "Validating FSSAI statutory fee structures..."*).
- [ ] **1.4. PDF Export Engine:**
  - Implement print-styled, investor-ready 1-click PDF download for the generated business plan.

---

## 🎯 Phase 2: Dual-State Founder Dashboard (Days 6–9)
- [ ] **2.1. New User Launchpad:**
  - Clean hero interface with quick-start input fields for new visitors.
- [ ] **2.2. Returning Founder Command Center:**
  - 90-day countdown timer to public launch.
  - Daily checkable action items pulled from the generated roadmap.
  - Budget burn meter (allocated vs spent vs runway).
  - Quick link to active research reports.
- [ ] **2.3. User Saved Analyses Persistence:**
  - Store and retrieve user business research reports in Supabase.

---

## 🎯 Phase 3: Demand-to-Research Hook & Idea Generator (Days 10–13)
- [ ] **3.1. Demand Linkage:**
  - Remove redundant standalone `Feed` view.
  - In `Demands.tsx`, add the **"Analyze This Opportunity"** 1-click CTA button that auto-populates the research form.
- [ ] **3.2. AI Idea Generator (`IdeaGenerator.tsx`):**
  - Input: City / Neighborhood + Budget.
  - Output: 3–5 high-potential business concepts matched directly to unmet community demands in that area.
- [ ] **3.3. Gov Data Portal Polish:**
  - Style the civic transparency hub ("For The People") with clean search for schemes, weather, and mandi prices.

---

## 🎯 Phase 4: Lightweight Community & Direct Inquiries (Days 14–17)
- [ ] **4.1. Founder Discussion Forum (`Community.tsx`):**
  - Supabase-backed question/answer threads with categories (Licensing, Vendors, Spaces, Growth).
- [ ] **4.2. Direct Network Inquiries (`NetworkChat.tsx`):**
  - 1-on-1 direct messaging threads between founders and commercial landlords/service providers.
- [ ] **4.3. Navigation & Clean Sidebar:**
  - Align `Sidebar.tsx` to the 8 core pillars.

---

## 🎯 Phase 5: Testing, Flagship Data Seeding & Beta Launch (Days 18–20)
- [ ] **5.1. Flagship Hub Ground Seeding:**
  - Ensure high-density competitor matrices and active rental benchmarks for Bangalore, Mumbai, and Delhi-NCR.
- [ ] **5.2. End-to-End Stress Test:**
  - Verify complete generation time, PDF export formatting, mobile responsiveness, and auth flows.
- [ ] **5.3. Beta Launch Readiness:**
  - Onboard 50 free target founders on December 15, 2026.
