# Technical Documentation: Bridgehead Project

## Project Overview
Bridgehead is a hyper-local market intelligence and execution platform designed to give entrepreneurs a "50/100 head start" by aggregating community demands, commercial rental data, and competitor information from verified local sources.

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS (utility-first approach with custom theming)
- **State Management**: React Context API (evident from AuthContext files)
- **Routing**: React Router DOM v7
- **UI Components**: Custom component library with common reusable elements
- **Maps Integration**: Leaflet with react-leaflet for location-based features
- **Virtual Scrolling**: @tanstack/react-virtual for efficient large list rendering
- **Build Tool**: Vite for fast development and HMR
- **Testing**: Vitest (mentioned in README)

### Backend
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript (backend/*.ts files)
- **Real-time Communication**: Socket.io for live messaging and notifications
- **Database**: MongoDB Atlas with Mongoose ODM
  - GeoJSON support for location-based queries
  - Evidence of schema evolution (deleted models replaced with lib/models structure)
- **Authentication**: JWT-based with bcryptjs for password hashing
- **API Design**: RESTful API structure with organized controllers and routes
- **Middleware**: Custom middleware for authentication, validation, and file processing
- **File Upload**: GridFS implementation (evidence of migration from uploadMiddleware to gridfs-native)

### AI & Machine Learning
- **Primary AI Provider**: Groq SDK
  - Model: llama-3.3-70b-versatile for market feasibility reports
  - Model: llama-3.1-8b-instant for ARU (Assistant) chatbot
- **Secondary AI Provider**: Google Gemini (mentioned in README)
- **Use Cases**:
  - Business feasibility report generation
  - Entrepreneurial guidance chatbot (ARU)
  - Market analysis and competitor research

### Development & DevOps
- **Version Control**: Git (current branch: master)
- **Package Management**: npm
- **Environment Variables**: 
  - Frontend: VITE_API_BASE_URL
  - Backend: MONGODB_URI, JWT_SECRET, GROQ_API_KEY, PORT
- **Development Scripts**:
  - `npm run dev` (both frontend and backend)
  - Nodemon for backend development
- **Configuration**: 
  - Vite: vite.config.ts (frontend) and vite.config.ts (backend)
  - TypeScript: tsconfig.json files in root and backend/

## Project Structure

### Root Level
```
/ (root)
├── App.tsx                 # Main React application component
├── index.tsx               # Frontend entry point
├── vite.config.ts          # Vite configuration
├── package.json            # Root dependencies and scripts
├── technical.md            # This document
├── README.md               # Project overview and setup instructions
└── ...                     # Other root-level assets and config files

/backend                    # Node.js backend
├── server.ts               # Server entry point
├── controllers/            # API route handlers
│   ├── aiController.ts
│   ├── authController.ts
│   ├── communityController.ts
│   ├── conversationController.ts
│   ├── postController.ts
│   ├── statsController.ts
│   ├── userController.ts
│   └── validationController.ts
├── routes/                 # Express route definitions
│   ├── auth/
│   ├── posts/
│   ├── images/
│   └── stats.ts
├── middleware/             # Custom Express middleware
│   ├── auth.ts
│   ├── gridfs-native.ts
│   ├── parseFormData.ts
│   ├── uploadMiddleware.ts
│   └── validation.ts
├── lib/                    # Refactored backend libraries
│   ├── auth.ts
│   ├── models/             # Mongoose schema definitions
│   │   ├── Message.ts
│   │   ├── Newsletter.ts
│   │   ├── Rental.ts
│   │   └── User.ts
│   ├── mongodb.ts          # Database connection utility
│   └── utils/
│       └── email.ts
├── utils/                  # Backend utility functions
│   └── email.ts
└── ...                     # Configuration, scripts, etc.

/components                 # React components
├── common/                 # Reusable UI components
│   ├── ErrorBoundary.tsx
│   └── Toast.tsx
├── feature-specific/       # Feature-oriented components
│   ├── AISuggestions.tsx
│   ├── DemandDetail.tsx
│   ├── Home.tsx
│   ├── RentalCard.tsx
│   ├── RentalListings.tsx
│   ├── Research.tsx
│   ├── SavedPosts.tsx
│   ├── ScrollToTopButton.tsx
│   └── Sidebar.tsx
└── ...                     # Additional components

/docs                       # Documentation
├── schema_documentation.md
├── MONGODB_ATLAS_SETUP.md
├── DEMAND_POSTING_GUIDE.md
├── roles.md
├── files_stucture.md
└── ...                     # Additional documentation

/constants                  # Application constants
├── categories.ts
└── indian_cities.json      # Geographic data

/utils                      # Frontend utility functions
├── fileUtils.ts
├── imageUrlUtils.ts
├── imageUtils.ts
└── locationUtils.ts
```

## Key Architectural Decisions

### 1. Hybrid AI Approach
The platform uses two different AI models for specialized tasks:
- **Llama 3 70B** (via Groq): For comprehensive market analysis and feasibility reports requiring deeper reasoning
- **Llama 3 8B Instant** (via Groq): For fast, responsive chatbot interactions (ARU Assistant)

### 2. Data Flow Architecture
```
External Sources (Justdial, Sulekha, OLX) 
        ↓ (Scraping/Aggregation)
Backend Database (MongoDB)
        ↓ (API)
Frontend React Application
        ↓ (User Interaction)
Real-time Updates via Socket.io
```

### 3. Location-Based Services
- MongoDB GeoJSON indexes for spatial queries
- Leaflet mapping integration for visualization
- Location-aware AI prompts for contextual business advice
- Distance-based competitor and demand analysis

### 4. Authentication System
- JWT-based stateless authentication
- Role-based access control (evident from roles.md)
- Password hashing with bcryptjs
- Preparation for MFA support (mentioned in README)

### 5. Real-time Features
- Socket.io for live chat between users
- Activity feed updates
- Notification system
- Collaborative features in "The Hive" community hub

## Data Models (Inferred from Code)

### User Model
- Authentication credentials (email, password hash)
- Profile information
- Preferences and settings
- Activity history

### Demand Post Model
- User-generated demand signals for missing local businesses
- Location data (GeoJSON)
- Category/tags
- Status (active, fulfilled, etc.)
- Engagement metrics

### Rental Post Model
- Commercial property listings
- Location and pricing information
- Property specifications
- Availability status
- Contact information

### Conversation Model
- Real-time messaging between users
- Message threading
- Read receipts
- Message timestamps

### Interaction Model
- User engagement with posts (likes, saves, shares)
- Analytics tracking
- Recommendation signals

## API Endpoints (Inferred from Routes)

### Authentication
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- GET /api/auth/me

### Users
- GET /api/users/:id
- PUT /api/users/:id
- GET /api/users (with filters)

### Demands
- GET /api/demands
- POST /api/demands
- GET /api/demands/:id
- PUT /api/demands/:id
- DELETE /api/demands/:id
- GET /api/demands/:id/comments

### Rentals
- GET /api/rentals
- POST /api/rentals
- GET /api/rentals/:id
- PUT /api/rentals/:id
- DELETE /api/rentals/:id

### AI Features
- POST /api/ai/feasibility-report
- POST /api/ai/chat (ARU Assistant)

### Statistics & Analytics
- GET /api/stats/market-overview
- GET /api/stats/trending-demands
- GET /api/stats/rental-trends

### Community Features
- GET /api/community/posts
- POST /api/community/posts
- GET /api/community/posts/:id
- POST /api/community/posts/:id/comments

## Security Considerations

### Implemented
- JWT authentication with expiration
- Password hashing using bcryptjs
- Input validation middleware
- CORS configuration
- Environment variable separation

### To Consider
- Rate limiting on API endpoints
- Helmet.js for HTTP header security
- Regular dependency security audits
- File upload validation (particularly for GridFS implementation)
- SQL/NoSQL injection prevention (though MongoDB reduces SQLi risk)
- XSS protection in frontend rendering

## Performance Optimizations

### Frontend
- React 19 concurrent features
- Tailwind CSS JIT compilation
- Virtual scrolling for large lists
- Image optimization utilities
- Code splitting via dynamic imports
- Efficient re-rendering with React.memo and useMemo

### Backend
- MongoDB indexing strategy (evident from cleanIndexes.js/fixIndex.js)
- Efficient aggregation pipelines
- Connection pooling
- Caching strategies (implied by trendingService.ts)
- GridFS for efficient file storage

## Development Workflow

### Setup
1. Clone repository
2. Install root dependencies: `npm install`
3. Install backend dependencies: `cd backend && npm install`
4. Configure environment variables
5. Start development servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `npm run dev`

### Database Management
- MongoDB Atlas cloud database
- Schema migrations managed through model updates
- Index maintenance scripts (cleanIndexes.js, fixIndex.js)

### Testing Approach
- Vitest for frontend unit/testing
- Manual testing implied by test files (test-demand-api.js, test_rentals.js)
- No visible end-to-end testing framework in current structure

## Deployment Considerations

### Environment Separation
- Development: Localhost with default ports
- Staging/Production: Would require proper environment configuration

### Key Deployment Files
- backend/.env (MongoDB URI, JWT secret, Groq key, PORT)
- Frontend .env (VITE_API_BASE_URL)
- Process managers (PM2 or similar for production)
- Reverse proxy configuration (NGINX/Apache for SSL)

### Scalability Factors
- MongoDB sharding potential for horizontal scaling
- Socket.io scaling with Redis adapter
- CDN for static assets
- Database read replicas for heavy read workloads

## Future Enhancement Indicators

### From Documentation
- "Project Analysis" (docs/project_analysis.md)
- "Deployment Plans" (docs/deployment_plans.md)
- "Schema Documentation" (docs/schema_documentation.md)

### Technical Signposts
- Competitor research module planned (mentioned in README)
- Advanced AI features roadmap
- Mobile application considerations
- Expanded payment/invoicing system
- Advanced analytics dashboard

## Current State Observations

### Codebase Evolution Evidence
- Significant refactoring apparent:
  - Old models deleted (CommunityComment.ts, CommunityPost.ts, etc.)
  - New lib/models/ structure created
  - Middleware migration (upload.ts → uploadMiddleware.ts, gridfs-upload.ts → gridfs-native.ts)
  - Route reorganization

### Active Development Signals
- Recent commits show feature additions (URL-based routing, LLM research docs)
- Mixed state: some legacy files alongside new implementations
- Configuration files present for various services
- Documentation being maintained

### Technology Currency
- Using current stable versions:
  - React 19 (released 2024)
  - Tailwind CSS 4.x
  - Node.js with ES modules
  - Latest MongoDB/Mongoose versions
  - Modern TypeScript (~5.8.2)

This technical documentation provides a comprehensive overview of the Bridgehead project's architecture, technologies, and current state based on codebase analysis.