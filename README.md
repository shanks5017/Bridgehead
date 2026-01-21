# 🌉 Bridgehead - Hyper-Local Marketplace Platform

> **Version**: 2.0  
> **Status**: Active Development  
> **Last Updated**: January 21, 2026

Bridgehead is a two-sided web marketplace connecting hyper-local community **demands** (missing services/businesses) with **entrepreneurs** seeking commercial properties and AI-powered business suggestions.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🏠 **Demand Posting** | Community posts for missing businesses/services |
| 🏢 **Rental Listings** | Commercial property listings with details |
| 🤖 **AI Business Ideas** | Location-aware suggestions using Groq/Gemini AI |
| 🔗 **AI Matching** | Intelligent demand-rental matching |
| 💬 **Real-time Messaging** | Socket.io deal negotiations |
| 👥 **Community Hub** | Discussion forums with topics & leaderboards |
| 🎨 **Premium UI** | Glassmorphism, animations, custom cursor |
| 🔐 **Authentication** | JWT auth with username/email login support |

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19, TypeScript | Component-based UI & type safety |
| **Styling** | Tailwind CSS (CDN) | Utility-first styling with custom theming |
| **Backend** | Node.js, Express, TypeScript | REST API & real-time services |
| **Database** | MongoDB Atlas | Cloud document database |
| **Real-time** | Socket.io | Live messaging & notifications |
| **AI** | Groq API / Google Gemini | Business ideas, matching, chatbot |
| **Build Tool** | Vite | Fast development & HMR |

---

## 📁 Project Structure

```
Bridgehead/
├── App.tsx                    # Main app component & routing
├── index.tsx                  # Application entry point
├── types.ts                   # Shared TypeScript interfaces
├── index.css                  # Global styles & animations
│
├── components/                # React Components (35+ files)
│   ├── Feed.tsx              # Social-media style feed layout
│   ├── Home.tsx              # Landing page with premium sections
│   ├── Header.tsx            # Global navigation
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Profile.tsx           # User profile management
│   ├── Chatbot.tsx           # AI-powered assistant
│   ├── DemandFeed.tsx        # Demand listings
│   ├── RentalListings.tsx    # Rental property listings
│   ├── CommunityHub.tsx      # Discussion forums
│   ├── Collaboration.tsx     # Messaging/deal system
│   ├── AIMatches.tsx         # AI matching interface
│   ├── AISuggestions.tsx     # Business idea generator
│   ├── CustomCursor.tsx      # Physics-based cursor
│   ├── PostDemandForm.tsx    # Demand submission form
│   ├── PostRentalForm.tsx    # Rental submission form
│   └── common/               # Reusable UI components
│
├── services/                  # Frontend Services
│   ├── groqService.ts        # Groq AI API integration
│   └── geminiService.ts      # Google Gemini (switchable)
│
├── backend/                   # Node.js Backend
│   ├── server.ts             # Express + Socket.io server
│   ├── controllers/          # API logic
│   │   ├── authController.ts
│   │   ├── postController.ts
│   │   ├── communityController.ts
│   │   ├── conversationController.ts
│   │   └── validationController.ts
│   ├── models/               # MongoDB Schemas
│   │   ├── User.ts
│   │   ├── DemandPost.ts
│   │   ├── RentalPost.ts
│   │   ├── CommunityPost.ts
│   │   ├── Conversation.ts
│   │   └── Message.ts
│   ├── routes/               # API Routes
│   ├── middleware/           # Auth, rate limiting
│   └── services/             # Backend services
│
├── docs/                      # Documentation (16 files)
│   ├── plans.md              # Master development roadmap
│   ├── database_plans.md     # MongoDB schema & optimization
│   ├── deployment_plans.md   # Cloud deployment guide
│   ├── security_plans.md     # Security hardening plans
│   ├── ai_enhancement_plans.md # AI service architecture
│   ├── ui_ux_plans.md        # Design system documentation
│   └── daily_report.md       # Development progress log
│
└── utils/                     # Utility functions
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
git clone https://github.com/yourusername/bridgehead.git
cd bridgehead

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Environment Variables

**Frontend** (`.env.local`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5001
```

### Running the App

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📚 Documentation

### Planning Documentation

| Document | Description |
|----------|-------------|
| [📋 Master Plan](docs/plans.md) | 5-phase development roadmap |
| [📊 Database Plans](docs/database_plans.md) | MongoDB Atlas, schema optimization |
| [🚀 Deployment Plans](docs/deployment_plans.md) | Oracle Cloud, Railway, CI/CD |
| [📈 Scalability Plans](docs/scalability_plans.md) | Redis, pagination, load balancing |
| [🔒 Security Plans](docs/security_plans.md) | API security, authentication |
| [✨ Features Plans](docs/features_plans.md) | OAuth, notifications, success stories |
| [🤖 AI Enhancement Plans](docs/ai_enhancement_plans.md) | Backend AI service, model selection |
| [🎨 UI/UX Plans](docs/ui_ux_plans.md) | Animations, mobile UX, design system |

### Technical Documentation

| Document | Description |
|----------|-------------|
| [Project Analysis](docs/project_analysis.md) | Comprehensive codebase analysis |
| [Architecture & Flows](docs/architecture_and_flows.md) | System architecture diagrams |
| [Daily Report](docs/daily_report.md) | Development progress log |

---

## 🏗️ Architecture

### Frontend Architecture

- **Centralized State**: Core state managed in `App.tsx` using React hooks
- **View Routing**: Simple view enum-based navigation
- **Component Categories**:
  - `*Feed.tsx` / `*Listings.tsx` - View containers
  - `*Card.tsx` - Presentational components
  - `*Form.tsx` - Input handling
  - `*Modal.tsx` - Overlay dialogs

### Backend Architecture

```
Client → Express API → Controllers → Models → MongoDB
              ↓
         Middleware (Auth, Rate Limit)
              ↓
         Socket.io (Real-time)
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | User registration |
| `/api/auth/login` | POST | Email/username login |
| `/api/demands` | GET/POST | Demand CRUD operations |
| `/api/rentals` | GET/POST | Rental CRUD operations |
| `/api/community` | GET/POST | Community posts |
| `/api/conversations` | GET/POST | Messaging |
| `/api/stats/*` | GET | Platform statistics |

---

## 🎨 UI/UX Features

- **Premium Aesthetic**: Glassmorphism cards, red glow effects
- **Custom Cursor**: Physics-based trailing ring with hover states
- **Scroll Progress**: Red reading progress indicator
- **Animations**: Shimmer effects, scale transitions
- **Responsive**: Mobile-first with Holy Grail desktop layout
- **Dark Theme**: Pure black backgrounds with neon accents

---

## � AI Integration

Currently using **Groq API** (switchable to Google Gemini):

| Feature | Model | Purpose |
|---------|-------|---------|
| **Chat** | llama-3.1-8b-instant | Fast conversational AI |
| **Business Ideas** | llama-3.3-70b-versatile | Location-aware suggestions |
| **AI Matching** | llama-3.3-70b-versatile | Demand-rental pairing |
| **Geocoding** | llama-3.1-8b-instant | Address resolution |

To switch back to Gemini, edit `services/geminiService.ts` and uncomment the original code.

---

## 📄 License

MIT License - See LICENSE file for details.

---

*Built with ❤️ for local entrepreneurs and communities*