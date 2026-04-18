# Bridgehead Schema Documentation

This document outlines the current database schemas for **Rentals** and **Demands**, and proposes a design for the upcoming **Competitors** feature.

## 1. Existing Schemas

### A. Rental Schema (`rentals` collection)
The Rental schema is used for listing properties or spaces available for lease.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title of the rental listing |
| `category` | String | Category (e.g., Retail, Office, Warehouse) |
| `description` | String | Detailed description of the space |
| `location` | Object | Geospatial data (Point) with address, city, state, zip, lat, lng |
| `images` | Array<String> | URLs or paths to images |
| `price` | Number | Rental price |
| `pricePerSqFtYearly`| Number | Calculated price per square foot per year |
| `squareFeet` | Number | Total area of the rental space |
| `leaseType` | String | Type of lease (e.g., Triple Net, Full Service) |
| `amenities` | Array<String> | List of amenities (e.g., Parking, HVAC, Wifi) |
| `zoningCode` | String | Local zoning classification |
| `phone` | String | Contact phone number |
| `email` | String | Contact email address |
| `collaborationOpen` | Boolean | Whether the poster is open to collaboration |
| `status` | Enum | `available`, `rented`, `expired` |
| `createdBy` | ObjectId | Reference to the `User` who created the post |
| `comments` | Array<Object> | Nested comments on the post |
| `upvotes` | Number | Count of upvotes |
| `upvotedBy` | Array<ObjectId>| List of users who upvoted |
| `hashtags` | Array<String> | Extracted hashtags for search |

---

### B. Demand Schema (`demands` collection)
The Demand schema is used for users to post their specific business needs or gaps they see in a market.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title of the demand/need |
| `category` | String | Business category (e.g., Coffee Shop, Grocery) |
| `description` | String | Detailed description of the need |
| `location` | Object | Geospatial data (Point) with address, city, state, zip, lat, lng |
| `demographics` | Array<String> | Target demographics for the business |
| `urgencyScore` | Number | How quickly the business is needed (1-10) |
| `distanceRadiusMiles`| Number | Area of influence for this demand |
| `images` | Array<String> | Reference images or site photos |
| `upvotes` | Number | Count of community interest |
| `upvotedBy` | Array<ObjectId>| List of users interested |
| `phone` | String | Contact phone number |
| `email` | String | Contact email address |
| `collaborationOpen` | Boolean | Open to partnership |
| `status` | Enum | `active`, `fulfilled`, `expired` |
| `createdBy` | ObjectId | Reference to the `User` |
| `comments` | Array<Object> | Nested comments |
| `hashtags` | Array<String> | Extracted hashtags |

---

## 2. Advanced Analytics: Competitors & Market Intelligence

This section defines the schemas for automated market analysis, integrating data from Justdial, Sulekha, and OLX.

This feature aims to show existing businesses in a specific area to help users analyze market saturation.

### Competitor Schema (`competitors` collection)
To support filtering by location and business type (e.g., "coffee shops in Belgaum"), the following structure is proposed:

```typescript
interface ICompetitor {
  name: string;               // e.g., "Starbucks", "Local Brew"
  category: string;           // e.g., "Coffee Shop", "Bakery"
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    address: string;
    city: string;
    state: string;
  };
  businessDetails: {
    rating?: number;
    priceLevel?: number;
    website?: string;
    phone?: string;
    openingHours?: string;
  };
  images: string[];
  dataSource: {
    source: 'justdial' | 'google' | 'sulekha' | 'manual';
    externalId?: string;      // ID from source
    lastSyncedAt: Date;
  };
  marketSentiment?: number;   // 0-1 score calculated from reviews/mentions
  tags: string[];
}
```

### 3. Market Feasibility Report Schema (`market_reports` collection)
Stores the generated "50/100" research for a specific business concept in a specific area.

```typescript
interface IMarketReport {
  userId: ObjectId;
  concept: string;            // e.g., "Premium Tea Stall"
  location: {
    city: string;
    neighborhood: string;
  };
  metrics: {
    competitorDensity: number; // Similar businesses in 2km
    demandIntensity: number;   // Relevant posters on Sulekha/Bridgehead
    avgRentalBenchmark: number; // Scaled from OLX data
    mpsScore: number;          // Market Potential Score (0-100)
  };
  aiAnalysis: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    suggestedExecution: string[];
  };
  status: 'draft' | 'final';
  createdAt: Date;
}
```

### Key Considerations for Implementation
1. **Geospatial Indexing**: A `2dsphere` index on `location` is required to efficiently find business "in a particular area".
2. **Search Index**: A compound index on `category` and `city` (or address) will allow fast filtering (e.g., "Coffee Shop" AND "Belgaum").
3. **Data Freshness**: Since competitor data changes (ratings, closures), the `dataSource` fields will track when we last refreshed the data from external APIs.
