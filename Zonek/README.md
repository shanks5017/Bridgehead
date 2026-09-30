# 🌉 Bridgehead - Hyper-Local Market Intelligence & Execution Platform

> **Version**: 2.2 [Enhanced Analytics]  
> **Status**: Active Development  
> **Last Updated**: April 1, 2026

Bridgehead is a data-driven market intelligence platform that gives entrepreneurs a **50/100 head start** by aggregating hyper-local community **demands**, commercial **rentals**, and **competitor data** from verified sources like Justdial, Sulekha, and OLX.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📊 **Market Analysis** | Automated 50/100 research using Justdial, Sulekha, and OLX data |
| 🏠 **Demand Posting** | Community-driven signals for missing local businesses |
| 🏢 **Rental Listings** | Verified commercial property availability with local price benchmarks |
| ⚔️ **Competitor Research**| Deep-dive into local competition saturation in specific neighborhoods |
| 🤖 **AI Feasibility** | Location-aware business feasibility reports using Groq/Gemini AI |
| 🔗 **Execution Plans** | "How-to" guides matching local demand with available assets |
| 💬 **Real-time Messaging**| Socket.io negotiations between entrepreneurs and property owners |
| 👥 **Community Hub** | "The Hive" - Hyper-local discussion forums and leaderboards |
| 🎨 **Premium UI** | Neo-Brutalist design with high-authority viewport layout |
| 🔐 **Authentication** | Secure JWT-based access with multi-factor support readiness |

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19, TypeScript, Vitest | Component-based UI & type safety |
| **Styling** | Tailwind CSS | Utility-first styling with custom theming |
| **Backend** | Node.js, Express, TypeScript | REST API & real-time services |
| **Database** | MongoDB Atlas (Mongoose) | Cloud document database with GeoJSON support |
| **Real-time** | Socket.io | Live messaging & notifications |
| **AI** | Groq SDK (Llama-3) / Gemini | Business ideas, matching, chatbot persona (ARU) |
| **Build Tool** | Vite | Fast development & HMR |

---

## 📁 Project Structure

```
Bridgehead/
├── backend/                   # Node.js Backend (Express + Socket.io)
│   ├── server.ts             # Server entry point
│   ├── controllers/          # API logic (Auth, AI, Posts, etc.)
│   ├── models/               # MongoDB Schemas (User, Demand, Rental, etc.)
│   ├── routes/               # API Express routes
│   └── middleware/           # Auth, validation, rate limiting
│
├── components/                # React Frontend Components (Root-level)
│   ├── common/               # Reusable UI elements
│   ├── Feed.tsx              # Main activity feed
│   └── ...                   # Feature-specific components
│
├── docs/                      # Technical Documentation
│   ├── schema_documentation.md # Detailed DB schemas & Competitor design [NEW]
│   ├── plans.md              # Development roadmap
│   └── project_analysis.md    # Codebase analysis report
│
├── App.tsx                    # Frontend Main App & Routing
├── index.tsx                  # Frontend entry point
├── vite.config.ts             # Vite configuration
└── package.json               # Root dependencies (Frontend)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Groq API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/shanks5017/Bridgehead.git
cd Bridgehead

# Install frontend dependencies (Root)
npm install

# Install backend dependencies
cd backend
npm install
```

### Environment Variables

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-key
PORT=5001
```

### Running the App

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend (Root)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

- [📋 Schema Documentation](docs/schema_documentation.md): Detailed look at Rentals, Demands, and the proposed Competitors design.
- [📊 Project Analysis](docs/project_analysis.md): Comprehensive codebase analysis.
- [🚀 Deployment Plans](docs/deployment_plans.md): Cloud deployment guide.

---

## 🏗️ Architecture

### AI-Driven Market Intelligence
Bridgehead uses a hybrid AI approach via the **Groq SDK** and **Gemini**:
- **Market Feasibility Reports**: Using `llama-3.3-70b-versatile` to synthesize scraped data into business execution plans.
- **ARU Assistant**: Using `llama-3.1-8b-instant` for rapid, supportive entrepreneurial guidance.

### The "50/100" Philosophy
We believe every entrepreneur should start with 50% of their research already done. By scraping verified directories (Justdial, Sulekha, OLX), we provide instant insight into:
1. **Demand Density**: What people are actually searching for.
2. **Competitor Saturation**: Who else is in the 2km radius.
3. **Rental Feasibility**: Current local benchmarks for commercial spaces.

### Future Vision: The Business Stock Market
Moving beyond marketplaces, Bridgehead aims to provide dynamic, ticker-like analysis for IT companies and tech startups, allowing new entrants to track market sentiment and competitive moves in real-time.

---

## 📄 License

MIT License - See LICENSE file for details.

---

*Built with ❤️ for local entrepreneurs and communities*