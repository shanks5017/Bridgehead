# Bridgehead Data Scraper Microservice

Production-grade Node.js + TypeScript backend that scrapes business data (Rentals, Demands, Competitors) from multiple sources across India and automatically syncs to MongoDB.

## Features

- **Multi-Source Scraping**: **JustDial** (Business Directory), **Sulekha** (B2B/B2C Demands), **OLX** (Rental & Equipment Benchmarks), and **Google Maps**.
- **Market Estimation Engine**: Automatically calculates competitor density and demand intensity per neighborhood.
- **Distributed Job Queue**: Powered by Bull and Redis for asynchronous, multi-threaded scraping.
- **Data Pipeline**: Raw HTML → OCR/Parse → Categorize → Validate → Deduplicate → MPS Scoring → Upsert MongoDB.
- **Geographic Hierarchy**: Granular scraping across Indian states, cities, pin-codes, and local "bastis".
- **Anti-Blocking Strategy**: Integrated rotation of **Indian Residential Proxies** to maintain 99% uptime against directory bans.

## Tech Stack

- **Runtime**: Node.js 18+ (Cluster Mode)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose) with 2dsphere indexes
- **Queue**: Bull + Redis (Upstash/Railway)
- **Scraping Engine**: Puppeteer (Stealth Plugin) + Axios + Cheerio
- **Networking**: Rotating Proxy Pool (Indian IPs)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

### Running the App

#### Development
```bash
npm run dev
```

#### Production
```bash
npm run build
npm start
```

#### Using Docker
```bash
docker-compose up --build
```

## API Endpoints

- `GET /api/health`: Service health check
- `GET /api/stats`: Current scraping statistics
- `POST /api/scrape/trigger`: Manually trigger a scraping job
- `GET /api/scrape/status/:jobId`: Check status of a background job

## Project Structure

- `src/scrapers/`: Source-specific scraping logic and aggregators.
- `src/services/`: Core business logic (DB, Geocoding, Deduplication).
- `src/queue/`: Background job definitions and processing.
- `src/models/`: Mongoose schemas.
- `src/api/`: Express routes and controllers.
- `src/utils/`: Shared utilities and helpers.
- `src/config/`: Configuration and environment management.

## License

MIT
