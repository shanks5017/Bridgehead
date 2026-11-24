# Zonek (Bridgehead) — Page Architecture & User Flows

> **Target Release:** Version 3.0 (Beta: Dec 15, 2026 | Launch: Jan 2027)  
> **Design Philosophy:** Neo-Brutalism, High Executive Clarity, Zero Fluff.

---

## 1. High-Level Navigation (The 8 Pillars)

The sidebar and global routes are structured around the 8 core pillars:

```
Zonek Application
├── /                           # Dual-State Founder Dashboard
├── /research                   # Feasibility Research Engine (5-Tab Sub-Navbar)
├── /demands                    # Community Demand Signals (+ 1-Click "Analyze")
├── /rentals                    # Verified Commercial Spaces Marketplace
├── /gov-data                   # Civic & Subsidy Transparency Portal ("For The People")
├── /ideas                      # Demand-Backed AI Idea Generator
├── /community                  # Lightweight Founder Discussion Board
├── /network                    # 1-on-1 Direct Messaging (Founder & Landlord Chat)
└── /auth                       # Modal / Dynamic Sign In & Sign Up
```

---

## 2. Page Directory & Functional Specifications

### 1. Founder Command Dashboard (`/`)
* **State A (New Visitor / No Active Reports):**
  * High-impact hero input: *Business Idea + Location + Total Budget*.
  * Trending neighborhood opportunities and demand highlights.
  * Direct CTA: *"Run Feasibility Scan"*.
* **State B (Returning Founder / Active Report):**
  * **Launch Countdown:** Days remaining until planned launch (e.g. *"Day 14 of 90"*).
  * **Today's Action Items:** 2–3 checkable tasks pulled from their generated 90-day roadmap.
  * **Capital & Burn Meter:** Total budget allocated vs estimated spent vs remaining runway.
  * **Saved Reports:** Quick link to view, print, or download past research.

---

### 2. Feasibility Research Engine (`/research`)
* **Intake Questionnaire:**
  * 5 intuitive steps: Core Business Info -> Location & Space -> Capital & Pricing -> Customer Persona -> Report Config.
* **Live Research Status Terminal:**
  * Streaming SSE terminal with real-world activity logs (*"Scanning local commercial rental listings...", "Cross-referencing state subsidy portals...", "Analyzing local competitor density..."*).
* **The 5-Tab Sub-Navbar Dashboard:**
  * **Tab 1: Overview & Feasibility** *(Verdict: GO / CAUTION / STOP, Problem/Solution, Seasonality & Launch Timing, Test Days Needed).*
  * **Tab 2: Micro-Location & Rentals** *(Zoning, active commercial rental rates/sqft, demand signal matching).*
  * **Tab 3: Competitors & Longevity** *(Active vs closed businesses in that area, verified competitor price matrix, Blue Ocean grid).*
  * **Tab 4: Financial Blueprint** *(Itemized setup costs to the rupee, unit economics, 12-month P&L, scenarios, pricing thresholds).*
  * **Tab 5: Gov Schemes & Compliance** *(Matched subsidies with claim URLs e.g. PMEGP/Mudra, mandatory licenses checklist).*
* **1-Click Investor PDF Export:** Clean, branded, print-ready PDF export suitable for bank loans and landlord lease reviews.

---

### 3. Demands Marketplace (`/demands`)
* Directory of community-submitted requests for missing local businesses.
* Upvote mechanism to validate local demand.
* **1-Click "Analyze This Opportunity" Button:** Directly populates the Feasibility Engine with that exact business and location.

---

### 4. Commercial Rentals (`/rentals`)
* Verified directory of commercial real estate listings (sqft, monthly rent, advance deposit, amenities).
* Filterable by city, neighborhood, and square footage.
* Linked directly into the Feasibility Research reports as actionable real-world options.

---

### 5. Gov Data Portal ("For The People") (`/gov-data`)
* Public civic intelligence portal.
* Searchable directory of Central & State government schemes, subsidies (Mudra, PMEGP, Stand-Up India), and eligibility rules.
* District-level civic metrics: Weather, agricultural mandi prices, and infrastructure updates.

---

### 6. AI Idea Generator (`/ideas`)
* Input: City / Neighborhood + Budget.
* Output: 3–5 high-potential business concepts cross-referenced against real neighborhood unmet demands.
* 1-Click transfer into the Feasibility Research Engine.

---

### 7. Founder Community (`/community`)
* Lightweight Supabase-backed peer discussion forum.
* Categories: *Permits & Licensing, Space Hunting, Vendor Sourcing, Marketing & Growth*.
* Question & answer threads for verified founders.

---

### 8. Network Direct Messaging (`/network`)
* Clean 1-on-1 direct messaging threads.
* Connects founders directly with commercial landlords or service providers.
* Inquiry initiated directly from rental listing or demand cards.
