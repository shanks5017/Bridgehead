# 📈 Scalability Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🔴 HIGH

---

## 📋 Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Traffic Projections](#traffic-projections)
3. [Redis Integration](#redis-integration)
4. [Pagination Implementation](#pagination-implementation)
5. [Caching Strategy](#caching-strategy)
6. [Load Balancing](#load-balancing)
7. [Database Scaling](#database-scaling)
8. [CDN Integration](#cdn-integration)
9. [Questions for Clarification](#questions-for-clarification)

---

## 📍 Current State Assessment

### Scalability Audit Results

| Aspect | Current Status | Gap | Priority |
|--------|----------------|-----|----------|
| Database Indexes | ✅ 2dsphere, text, compound | None | ✅ |
| Pagination | ❌ Not implemented | Need cursor-based pagination | 🔴 HIGH |
| Connection Pooling | ⚠️ Using defaults | Should configure | 🟡 MEDIUM |
| Horizontal Scaling | ❌ Not prepared | Need Redis for sessions/rate-limiting | 🔴 HIGH |
| CDN for Assets | ❌ Not implemented | Need for images/static files | 🔴 HIGH |
| Rate Limiting | ⚠️ In-memory only | Use Redis-backed solution | 🔴 HIGH |
| Caching | ❌ No HTTP caching headers | Add Cache-Control headers | 🔴 HIGH |

### Current Bottlenecks

```
1. Rate Limiter (rateLimiter.ts)
   └── Uses in-memory Map → Won't work with multiple servers

2. Session State
   └── No session management → Can't scale horizontally

3. Feed Endpoints
   └── No pagination → Will crash with large datasets

4. Image Serving
   └── Served from MongoDB → High latency, no caching
```

---

## 📊 Traffic Projections

### User Growth Scenarios

| Phase | Users | Concurrent | Req/sec | DB Ops/sec |
|-------|-------|------------|---------|------------|
| MVP | 1k | 50 | 10 | 100 |
| Growth | 10k | 500 | 100 | 1,000 |
| Scale | 50k | 2,500 | 500 | 5,000 |
| Production | 100k+ | 5,000+ | 1,000+ | 10,000+ |

### Resource Requirements

| Users | Servers | RAM/Server | MongoDB Tier | Redis |
|-------|---------|------------|--------------|-------|
| 1k | 1 | 2GB | M0 Free | Not needed |
| 10k | 2-3 | 4GB | M10 (2GB) | 1 instance |
| 50k | 6-10 | 8GB | M20 (4GB) | 2+ instances |
| 100k+ | 15+ | 16GB | M30+ (8GB) | Cluster |

### Peak Traffic Estimates

```javascript
// Peak hour multiplier: 3-5x average
// Example: 10k users

Average Traffic:
  - Concurrent users: 500
  - Requests/minute: 6,000
  - Requests/second: 100

Peak Traffic (3x):
  - Concurrent users: 1,500
  - Requests/minute: 18,000
  - Requests/second: 300

System must handle: 300 req/sec sustained
```

---

## 🔴 Redis Integration

### Why Redis?

| Use Case | In-Memory (Current) | Redis (Target) |
|----------|---------------------|----------------|
| Rate Limiting | Per-server only | Shared across cluster |
| Session Storage | None | Centralized sessions |
| Caching | None | Query result caching |
| Pub/Sub | Polling | Real-time events |
| Queue | None | Background job queue |

### Installation

```bash
# Install Redis (Ubuntu/Oracle Linux)
sudo dnf install -y redis
sudo systemctl enable redis
sudo systemctl start redis

# Verify
redis-cli ping
# Response: PONG

# OR use Redis Cloud (free tier: 30MB)
# https://redis.com/try-free/
```

### Backend Integration

```typescript
// backend/config/redis.ts (NEW FILE)
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export default redis;
```

### Redis-Backed Rate Limiter

```typescript
// backend/middleware/rateLimiter.ts (UPDATED)
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth endpoints
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: {
    error: 'Too many auth attempts. Try again in 1 minute.',
  },
});

// Validation limiter (existing, upgraded)
export const validationRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 checks per minute
});
```

### Apply Rate Limiting

```typescript
// backend/server.ts
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter';

// Apply to all API routes
app.use('/api/', apiRateLimiter);

// Stricter limit on auth routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
```

---

## 📄 Pagination Implementation

### Current Issue

```typescript
// Current (PROBLEM):
const posts = await DemandPost.find({ status: 'active' }); // Returns ALL posts!
```

### Cursor-Based Pagination (Recommended)

```typescript
// backend/controllers/postController.ts (UPDATED)

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
    total: number;
  };
}

export const getDemandPosts = async (req: Request, res: Response) => {
  const { 
    cursor, // Last post ID from previous page
    limit = 20, 
    category, 
    status = 'active' 
  } = req.query;
  
  const parsedLimit = Math.min(parseInt(limit as string) || 20, 50); // Max 50
  
  // Build query
  const query: any = { status };
  if (category) query.category = category;
  
  // Cursor pagination
  if (cursor) {
    query._id = { $lt: cursor }; // Get posts older than cursor
  }
  
  const posts = await DemandPost.find(query)
    .sort({ _id: -1 }) // Newest first
    .limit(parsedLimit + 1) // Fetch one extra to check if more exist
    .populate('createdBy', 'fullName username profilePicture');
  
  const hasNextPage = posts.length > parsedLimit;
  if (hasNextPage) posts.pop(); // Remove the extra item
  
  const response: PaginatedResponse<IDemandPost> = {
    data: posts,
    pagination: {
      hasNextPage,
      nextCursor: hasNextPage ? posts[posts.length - 1]._id.toString() : null,
      total: await DemandPost.countDocuments({ status })
    }
  };
  
  res.json(response);
};
```

### Frontend Integration

```typescript
// Example: Infinite scroll hook
const usePaginatedFeed = (category?: string) => {
  const [posts, setPosts] = useState<DemandPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (category) params.set('category', category);
    
    const res = await fetch(`${API_URL}/posts/demands?${params}`);
    const { data, pagination } = await res.json();
    
    setPosts(prev => [...prev, ...data]);
    setCursor(pagination.nextCursor);
    setHasMore(pagination.hasNextPage);
    setLoading(false);
  };
  
  return { posts, loadMore, hasMore, loading };
};
```

### Pagination for All Feeds

| Endpoint | Current | Target | Priority |
|----------|---------|--------|----------|
| GET /api/posts/demands | No pagination | Cursor-based | 🔴 HIGH |
| GET /api/posts/rentals | No pagination | Cursor-based | 🔴 HIGH |
| GET /api/community/posts | No pagination | Cursor-based | 🔴 HIGH |
| GET /api/notifications | N/A | Cursor-based | 🟡 MEDIUM |
| GET /api/conversations | No pagination | Cursor-based | 🟡 MEDIUM |

---

## 🗄️ Caching Strategy

### HTTP Cache Headers

```typescript
// backend/server.ts

// Cache static assets for 1 year (immutable)
app.use('/api/images', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

// Cache API responses (with revalidation)
app.use('/api/posts', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  next();
});

// No cache for user-specific data
app.use('/api/auth', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private');
  next();
});
```

### Redis Query Caching

```typescript
// backend/services/cacheService.ts (NEW FILE)
import redis from '../config/redis';

const CACHE_TTL = {
  TRENDING: 300,      // 5 minutes
  CATEGORIES: 3600,   // 1 hour
  USER_STATS: 600,    // 10 minutes
  FEED: 60,           // 1 minute
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await redis.setex(key, ttl || 300, JSON.stringify(value));
  },
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  }
};

// Usage example:
export const getTrendingPosts = async () => {
  const cacheKey = 'trending:posts';
  
  // Check cache first
  const cached = await cache.get<any[]>(cacheKey);
  if (cached) return cached;
  
  // If not cached, query DB
  const trending = await DemandPost.find({ status: 'active' })
    .sort({ upvotes: -1 })
    .limit(10);
  
  // Cache for 5 minutes
  await cache.set(cacheKey, trending, CACHE_TTL.TRENDING);
  
  return trending;
};
```

### Cache Invalidation Strategy

```javascript
// Invalidate on write operations:

// When new post created:
await cache.invalidate('feed:*');
await cache.invalidate('trending:*');

// When post updated:
await cache.invalidate(`post:${postId}`);
await cache.invalidate('feed:*');

// When user profile updated:
await cache.invalidate(`user:${userId}:*`);
```

---

## ⚖️ Load Balancing

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bridgehead-api',
    script: './backend/dist/server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    
    // Graceful scaling
    wait_ready: true,
    listen_timeout: 10000,
    
    // Memory management
    max_memory_restart: '1G',
    
    // Environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

### Nginx Configuration (Multiple Servers)

```nginx
# For multiple backend servers
upstream bridgehead_cluster {
    least_conn; # Load balancing method
    
    server 10.0.0.1:5001 weight=5;
    server 10.0.0.2:5001 weight=5;
    server 10.0.0.3:5001 backup;
    
    keepalive 64;
}

server {
    location /api {
        proxy_pass http://bridgehead_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        # ... other proxy settings
    }
}
```

### Sticky Sessions (for Socket.io)

```nginx
# Socket.io requires sticky sessions
upstream bridgehead_socket {
    ip_hash; # Sticky sessions based on client IP
    
    server 10.0.0.1:5001;
    server 10.0.0.2:5001;
}

location /socket.io {
    proxy_pass http://bridgehead_socket;
    # ... WebSocket settings
}
```

---

## 🗃️ Database Scaling

### MongoDB Connection Pool

```typescript
// backend/config/db.ts (UPDATED)
import mongoose from 'mongoose';

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, {
    // Connection Pool Settings
    maxPoolSize: 50,      // Max connections in pool
    minPoolSize: 5,       // Maintain minimum connections
    maxIdleTimeMS: 30000, // Close idle connections after 30s
    
    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Write concern
    w: 'majority',
    retryWrites: true,
  });
  
  console.log('✅ MongoDB connected with pool size 50');
};
```

### Read Replicas (MongoDB Atlas)

```
For 50k+ users, configure:

1. Primary (M20): Handles writes
2. Secondary 1: Read replica for API queries
3. Secondary 2: Analytics queries

Set read preference in queries:
```

```typescript
// Read from secondary for non-critical queries
const trendingPosts = await DemandPost.find()
  .read('secondaryPreferred')
  .sort({ upvotes: -1 })
  .limit(10);
```

---

## 🌐 CDN Integration

### Why CDN?

| Without CDN | With CDN |
|-------------|----------|
| Images from MongoDB (slow) | Images from edge (fast) |
| High server load | Offloaded to CDN |
| No geographic optimization | Served from nearest edge |
| ~500ms latency | ~50ms latency |

### Cloudflare (Free Tier)

```bash
# Setup:
1. Add site to Cloudflare
2. Update nameservers at domain registrar
3. Configure caching rules
4. Enable "Always HTTPS"
```

```javascript
// Cloudflare Page Rules:

// Cache static assets
URL: *bridgehead.com/api/images/*
Setting: Cache Everything, Edge TTL: 1 month

// Bypass cache for API
URL: *bridgehead.com/api/*
Setting: Cache Level: Bypass
```

### Image CDN (Cloudinary)

```typescript
// backend/services/imageService.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (base64Image: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: 'bridgehead',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' } // WebP for modern browsers
    ]
  });
  
  return result.secure_url;
};
```

---

## ❓ Questions for Clarification

> **Please answer these before implementation:**

### Redis
1. **Redis Provider**: Which do you prefer?
   - [ ] Self-hosted on Oracle Cloud (free, more setup)
   - [ ] Redis Cloud (30MB free, managed)
   - [ ] Skip for now (limit to single server)

### Scaling Timeline
2. **Expected User Growth**: What's the realistic timeline?
   - [ ] < 1k users for 6+ months (single server OK)
   - [ ] 1k-10k users within 3 months (need Redis)
   - [ ] 10k+ users quickly (full scaling needed)

### CDN
3. **Image CDN**: When to implement?
   - [ ] Now (with Cloudinary free tier)
   - [ ] Later (when storage limit hit)
   - [ ] Use Cloudflare only (no external image CDN)

### Caching
4. **Cache Aggressiveness**: How fresh should data be?
   - [ ] Real-time (minimal caching, more DB load)
   - [ ] Near real-time (60s cache, balanced)
   - [ ] Eventual consistency (5min cache, scalable)

---

## 📁 Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `backend/config/redis.ts` | Redis connection | 🔴 HIGH |
| `backend/services/cacheService.ts` | Caching utilities | 🔴 HIGH |
| `ecosystem.config.js` | PM2 cluster config | 🔴 HIGH |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `backend/middleware/rateLimiter.ts` | Redis store | 🔴 HIGH |
| `backend/controllers/postController.ts` | Add pagination | 🔴 HIGH |
| `backend/controllers/communityController.ts` | Add pagination | 🔴 HIGH |
| `backend/server.ts` | Cache headers, compression | 🔴 HIGH |
| `backend/config/db.ts` | Connection pooling | 🟡 MEDIUM |

---

*Last updated: December 24, 2025*
