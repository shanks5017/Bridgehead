# 🌉 Zonek (Bridgehead) — Ground-Truth Feasibility & Execution Engine

> **Version**: 3.0 [Enterprise Feasibility & Launch Command Center]  
> **Status**: Active Build Sprint (Target Beta: Dec 15, 2026 | Launch: Jan 2027)  
> **Last Updated**: November 24, 2026

Zonek is a data-grounded business feasibility and execution platform designed for entrepreneurs, retail operators, and startup founders. It bridges the high-risk gap between *having an idea & budget* and *executing safely on the ground* by combining verified micro-location evidence (commercial rentals, competitor pricing, civic density, government grants) with battle-tested founder frameworks.

---

## 🏛️ The 8 Core Product Pillars

| # | Pillar | Description |
|---|---|---|
| **1** | 🏠 **Founder Command Dashboard** | **Home screen & Retention engine.** Dual-state UI: Launchpad for new ideas, and active 90-day launch command center with daily checkable sprint tasks and budget burn meter for active founders. |
| **2** | 🔬 **Feasibility Research Engine** | **The Brain.** 5-Tab Sub-Navbar layout: *Executive Feasibility & Timing*, *Micro-Location & Rentals*, *Competitors & Longevity*, *Financial Blueprint*, *Gov Schemes & Compliance* + 1-Click Investor PDF Download. |
| **3** | 📢 **Demands Marketplace** | **Unmet community business requests.** Locals post needs; founders discover high-demand niches with a **1-click "Analyze This Opportunity"** button that pre-populates research. |
| **4** | 🏢 **Commercial Rentals** | **Verified spaces marketplace.** Commercial property listings linked dynamically to feasibility research reports as concrete options. |
| **5** | 🏛️ **Gov Data Portal ("For The People")** | **Civic transparency portal.** Public access to district statistics, weather patterns, agricultural mandi pricing, and government subsidy schemes (Mudra, PMEGP). |
| **6** | 💡 **AI Idea Generator** | **Demand-backed business generator.** Enter a city/pin code and budget -> AI generates top 3–5 viable business ideas cross-referenced against real neighborhood unmet demands. |
| **7** | 👥 **Founder Community** | **Lightweight discussion board.** Supabase-backed peer community where founders ask questions, share local vendor reviews, and discuss launch obstacles. |
| **8** | 💬 **Network Messaging** | **Direct inquiry system.** 1-on-1 direct messaging between founders, commercial landlords, and service providers. |

---

## 🛠️ Modern Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19, TypeScript, Vite | Ultra-fast component-based UI & type safety |
| **Styling** | Tailwind CSS (Neo-Brutalist design system) | High-contrast, executive aesthetic with responsive viewports |
| **Backend** | Node.js, Express, TypeScript | REST API, SSE streaming, authentication, and validation |
| **Database & Auth** | Supabase (PostgreSQL) | Managed relational database, Row Level Security, and JWT auth |
| **AI / Reasoning Engine** | Groq SDK (`openai/gpt-oss-120b`) | Primary 120B reasoning model (2-5s generation, zero rate limits) |
| **Export Engine** | Client-side & Server PDF Generation | 1-Click investor-ready, print-styled PDF reports |

---

## 📁 Project Architecture

```
Zonek_Main/
├── Zonek/
│   ├── backend/                      # Node.js Express Backend
│   │   ├── controllers/              # API Controllers
│   │   │   ├── authController.ts     # Supabase Auth & Profile fallback
│   │   │   └── businessResearchController.ts # 120B Feasibility Engine
│   │   ├── routes/                   # Express routes
│   │   │   ├── auth.ts               # Login / Register
│   │   │   └── businessResearch.ts   # Full-report streaming & individual tabs
│   │   ├── lib/supabase.ts           # Supabase service role client
│   │   └── server.ts                 # Express entry point (Port 5001)
│   │
│   ├── components/                   # React Frontend
│   │   ├── Dashboard.tsx             # Founder Command Center
│   │   ├── BusinessResearch.tsx      # 5-Step Intake & 5-Tab Sub-Navbar Report
│   │   ├── Demands.tsx               # Community Demand Signals with 1-Click Research
│   │   ├── Rentals.tsx               # Commercial Property Listings
│   │   ├── GovData.tsx               # Civic & Schemes Portal ("For The People")
│   │   ├── IdeaGenerator.tsx         # AI Idea Generator backed by Demands
│   │   ├── Community.tsx             # Founder Discussion Forum
│   │   ├── NetworkChat.tsx           # 1-on-1 Direct Messaging
│   │   ├── Sidebar.tsx               # Clean 8-Pillar Navigation
│   │   └── SignUp.tsx / SignIn.tsx   # Authentication Gate
│   │
│   ├── types.ts                      # Full TypeScript interfaces
│   └── package.json
│
├── checklist.md                      # Master 20-Day Build & Beta Sprint Plan
└── founders_report.md                # Strategic Founder & Executive Summary
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase project credentials (URL & Service Role Key)
- Groq API Key

### 2. Environment Variables

**Backend (`Zonek/backend/.env`):**
```env
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
NODE_ENV=development
```

**Frontend (`Zonek/.env`):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Running Locally

```bash
# Terminal 1: Backend Server (Port 5001)
cd Zonek/backend
npm run dev

# Terminal 2: Frontend App (Port 5173)
cd Zonek
npm run dev
```

---

## 📅 Roadmap to Launch

- **Sprint 1 (Weeks 1–2):** 5-Tab Sub-Navbar Research Engine, 1-Click PDF Export, Founder Dashboard.
- **Sprint 2 (Week 3):** Demands hook, Idea Generator, Gov Data viewer polish, Lightweight Community & Network Chat.
- **Private Beta (Dec 15–25, 2026):** 50 Free Founders across Bangalore, Mumbai, and Delhi-NCR.
- **Commercial Public Launch:** Early January 2027.
