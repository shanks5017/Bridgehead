# 📊 Database Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🔴 HIGH

---

## 📋 Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [MongoDB Atlas Migration](#mongodb-atlas-migration)
3. [Schema Optimization](#schema-optimization)
4. [Indexing Strategy](#indexing-strategy)
5. [Data Archival System](#data-archival-system)
6. [Storage Management](#storage-management)
7. [Backup & Recovery](#backup--recovery)
8. [Questions for Clarification](#questions-for-clarification)

---

## 📍 Current State Assessment

### Existing Models (10 Files)

| Model | File | Size | Key Features |
|-------|------|------|--------------|
| User | `User.ts` | 5.3KB | JWT, bcrypt, profile photo, posts refs |
| DemandPost | `DemandPost.ts` | 4.0KB | GeoJSON, comments, upvotes, 2dsphere |
| RentalPost | `RentalPost.ts` | 4.1KB | Pricing, sqft, GeoJSON |
| CommunityPost | `CommunityPost.ts` | 2.1KB | Likes, reposts, moderation status |
| CommunityComment | `CommunityComment.ts` | 1.5KB | Nested replies |
| Conversation | `Conversation.ts` | 1.5KB | Linked refs, role context |
| Message | `Message.ts` | 1.3KB | Text + media support |
| Interaction | `Interaction.ts` | 0.8KB | User-post interactions |

### Current Database Configuration

```typescript
// backend/config/db.ts
connectDB() configuration:
- serverSelectionTimeoutMS: 5000ms
- socketTimeoutMS: 45000ms
- Graceful shutdown handlers (SIGINT, SIGTERM, SIGUSR2)
```

### Existing Indexes ✅

```javascript
// DemandPost/RentalPost already have:
- 2dsphere on location.coordinates (geospatial queries)
- text on title, description, address (full-text search)
- compound on createdBy, status, createdAt
```

---

## 🌐 MongoDB Atlas Migration

### Why Atlas?

| Benefit | Details |
|---------|---------|
| **Managed Service** | No server maintenance |
| **Global Clusters** | Multi-region replication |
| **Auto-scaling** | Scales with traffic |
| **Built-in Backup** | Point-in-time recovery |
| **Security** | Encryption at rest, network isolation |

### Migration Steps

#### Step 1: Create Atlas Cluster

```bash
# 1. Go to https://cloud.mongodb.com
# 2. Create M0 Free Tier cluster (512MB)
# 3. Choose region closest to users (e.g., Mumbai for India)
# 4. Set up database user with strong password
# 5. Whitelist server IP addresses (or 0.0.0.0/0 for all)
```

#### Step 2: Update Connection String

```env
# backend/.env
# OLD (local)
MONGODB_URI=mongodb://localhost:27017/bridgehead

# NEW (Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bridgehead?retryWrites=true&w=majority
```

#### Step 3: Migrate Data (if existing)

```bash
# Export from local
mongodump --db bridgehead --out ./backup/

# Import to Atlas
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net" ./backup/
```

### Atlas Tier Recommendations

| Users | Tier | Storage | RAM | Cost/Month |
|-------|------|---------|-----|------------|
| 0-1k | M0 Free | 512MB | Shared | $0 |
| 1k-10k | M2 | 2GB | 256MB | $9 |
| 10k-50k | M10 | 10GB | 2GB | $57 |
| 50k+ | M20/M30 | 40GB+ | 4-8GB | $140+ |

---

## 🔧 Schema Optimization

### Proposed Schema Improvements

#### 1. User Model Enhancement

```typescript
// Add to backend/models/User.ts
interface IUserEnhanced extends IUser {
  username: string; // For username login (already exists)
  lastLogin?: Date;
  loginCount: number;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    searchAlerts: boolean;
  };
  profileComplete: number; // 0-100 percentage
}
```

#### 2. Notification Model (NEW)

```typescript
// backend/models/Notification.ts (TO CREATE)
const NotificationSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['match', 'message', 'upvote', 'comment', 'system', 'alert'],
    required: true
  },
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, maxlength: 500 },
  data: Schema.Types.Mixed, // { postId, commentId, matchId, etc. }
  read: { type: Boolean, default: false, index: true },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Indexes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

#### 3. Success Story Model (NEW)

```typescript
// backend/models/SuccessStory.ts (TO CREATE)
const SuccessStorySchema = new Schema({
  demandId: { type: ObjectId, ref: 'DemandPost' },
  rentalId: { type: ObjectId, ref: 'RentalPost' },
  participants: [{ type: ObjectId, ref: 'User' }],
  
  story: {
    headline: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 2000 },
    images: [String], // URLs
    businessName: String,
    location: String,
    industry: String
  },
  
  metrics: {
    jobsCreated: Number,
    investmentAmount: Number,
    openingDate: Date,
    monthlyRevenue: Number
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'featured', 'rejected'], 
    default: 'pending' 
  },
  featured: { type: Boolean, default: false, index: true },
  viewCount: { type: Number, default: 0 },
  
  submittedBy: { type: ObjectId, ref: 'User', required: true },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });
```

#### 4. Archived Post Model (NEW)

```typescript
// backend/models/ArchivedPost.ts (TO CREATE)
const ArchivedPostSchema = new Schema({
  originalId: { type: ObjectId, required: true },
  type: { type: String, enum: ['demand', 'rental'], required: true },
  
  // Minimal archived data
  title: String,
  category: String,
  summary: { type: String, maxlength: 200 }, // Truncated description
  location: { address: String },
  
  // Metadata
  originalCreatedAt: Date,
  archivedAt: { type: Date, default: Date.now },
  archivedReason: { 
    type: String, 
    enum: ['fulfilled', 'expired', 'deleted', 'auto_90_days'] 
  },
  
  // Stats at time of archival
  upvotes: Number,
  viewCount: Number,
  messageCount: Number
}, { timestamps: false }); // No need for timestamps

// NO IMAGES stored in archive (save space)
```

#### 5. Search Alert Model (NEW)

```typescript
// backend/models/SearchAlert.ts (TO CREATE)
const SearchAlertSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  
  query: {
    type: { type: String, enum: ['demand', 'rental'], required: true },
    category: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
      radiusKm: { type: Number, default: 10 }
    },
    priceRange: { min: Number, max: Number },
    keywords: [String]
  },
  
  frequency: { 
    type: String, 
    enum: ['instant', 'daily', 'weekly'], 
    default: 'daily' 
  },
  channel: {
    type: String,
    enum: ['email', 'push', 'both'],
    default: 'email'
  },
  
  active: { type: Boolean, default: true },
  lastTriggered: Date,
  matchCount: { type: Number, default: 0 }
}, { timestamps: true });
```

---

## 🔍 Indexing Strategy

### Recommended Additional Indexes

```javascript
// User indexes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ 'lastLogin': -1 });

// DemandPost indexes (additional)
db.demandposts.createIndex({ category: 1, createdAt: -1 });
db.demandposts.createIndex({ upvotes: -1, createdAt: -1 }); // Trending

// RentalPost indexes (additional)
db.rentalposts.createIndex({ price: 1, squareFeet: 1 });
db.rentalposts.createIndex({ category: 1, status: 1 });

// Notification indexes
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });

// Conversation indexes
db.conversations.createIndex({ 'participants': 1, lastMessageAt: -1 });
```

### Index Maintenance

```javascript
// Weekly index analysis script
// backend/scripts/analyzeIndexes.js

const analyzeIndexUsage = async () => {
  const collections = ['users', 'demandposts', 'rentalposts', 'communityPosts'];
  
  for (const coll of collections) {
    const stats = await db.collection(coll).aggregate([
      { $indexStats: {} }
    ]).toArray();
    
    console.log(`\n${coll} index usage:`);
    stats.forEach(idx => {
      console.log(`  ${idx.name}: ${idx.accesses.ops} queries`);
    });
  }
};
```

---

## 🗄️ Data Archival System

### Archival Rules

| Post Type | Archive Trigger | Time Limit |
|-----------|-----------------|------------|
| Demand (solved) | Status → 'solved' | 30 days |
| Demand (expired) | No activity | 90 days |
| Rental (rented) | Status → 'rented' | 30 days |
| Rental (expired) | No activity | 90 days |

### Archival Job Implementation

```typescript
// backend/jobs/archivalJob.ts (TO CREATE)
import cron from 'node-cron';
import { DemandPost, RentalPost, ArchivedPost } from '../models';
import { GridFSBucket } from 'mongodb';

// Run daily at 2 AM
cron.schedule('0 2 * * *', archiveOldPosts);

async function archiveOldPosts() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // Archive solved/rented posts older than 30 days
  const completedPosts = await DemandPost.find({
    $or: [
      { status: 'solved', updatedAt: { $lt: thirtyDaysAgo } },
      { status: 'fulfilled', updatedAt: { $lt: thirtyDaysAgo } }
    ]
  });
  
  // Archive inactive posts older than 90 days
  const inactivePosts = await DemandPost.find({
    status: 'active',
    updatedAt: { $lt: ninetyDaysAgo }
  });
  
  for (const post of [...completedPosts, ...inactivePosts]) {
    // Create archive record
    await ArchivedPost.create({
      originalId: post._id,
      type: 'demand',
      title: post.title,
      category: post.category,
      summary: post.description.substring(0, 200),
      location: { address: post.location.address },
      originalCreatedAt: post.createdAt,
      archivedReason: post.status === 'solved' ? 'fulfilled' : 'auto_90_days',
      upvotes: post.upvotes
    });
    
    // Delete images from GridFS
    if (post.images?.length) {
      await deleteImagesFromGridFS(post.images);
    }
    
    // Delete original post
    await post.deleteOne();
  }
  
  console.log(`Archived ${completedPosts.length + inactivePosts.length} posts`);
}
```

---

## 💾 Storage Management

### Current Storage Pattern

| Content Type | Storage Method | Sizes |
|--------------|----------------|-------|
| Profile Pictures | GridFS | 3 sizes (original, thumb, icon) ≈ 200KB/user |
| Post Images | GridFS | Variable, up to 5 per post |
| Community Media | GridFS | Images + videos |

### Storage Optimization Strategies

#### 1. Aggressive Image Compression

```typescript
// backend/services/imageService.ts
const OPTIMIZED_SIZES = {
  original: { width: 800, height: 800, quality: 70 }, // Was 1080
  thumbnail: { width: 300, height: 300, quality: 60 }, // Was 400
  icon: { width: 64, height: 64, quality: 50 }, // Was 128
};

// Estimated savings: ~40% reduction
```

#### 2. External Storage for Overflow

```typescript
// Option A: Cloudinary (25GB free)
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Option B: ImageKit (20GB free)
const ImageKit = require('imagekit');
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});
```

#### 3. Storage Threshold Monitoring

```typescript
// backend/jobs/storageMonitor.ts
async function checkStorageUsage() {
  const stats = await db.command({ dbStats: 1 });
  const usedGB = stats.dataSize / (1024 * 1024 * 1024);
  const limitGB = 0.512; // 512MB free tier
  
  const usagePercent = (usedGB / limitGB) * 100;
  
  if (usagePercent > 80) {
    // Alert admin
    await sendAdminAlert({
      type: 'storage_warning',
      message: `Storage at ${usagePercent.toFixed(1)}% (${usedGB.toFixed(2)}GB / ${limitGB}GB)`
    });
  }
  
  if (usagePercent > 95) {
    // Trigger emergency archival
    await emergencyArchiveOldImages();
  }
}
```

---

## 🔄 Backup & Recovery

### Backup Strategy

| Backup Type | Frequency | Retention | Method |
|-------------|-----------|-----------|--------|
| Full Backup | Daily | 30 days | mongodump |
| Incremental | Hourly | 7 days | Oplog tailing |
| Point-in-time | Continuous | 24 hours | Atlas PITR |

### Backup Script

```bash
#!/bin/bash
# backup-mongodb.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGO_URI=$1

# Create backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$TIMESTAMP"

# Compress
tar -czvf "$BACKUP_DIR/$TIMESTAMP.tar.gz" "$BACKUP_DIR/$TIMESTAMP"
rm -rf "$BACKUP_DIR/$TIMESTAMP"

# Keep only last 30 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +31 | xargs -r rm

echo "Backup completed: $BACKUP_DIR/$TIMESTAMP.tar.gz"
```

### Recovery Procedure

```bash
# 1. Stop application servers
pm2 stop all

# 2. Restore from backup
mongorestore --uri="$MONGO_URI" --drop ./backup/bridgehead/

# 3. Verify data integrity
mongo "$MONGO_URI" --eval "db.users.count(); db.demandposts.count();"

# 4. Restart application
pm2 restart all
```

---

## ❓ Questions for Clarification

> **Please answer these before implementation:**

### Storage Strategy
1. **Storage Budget**: With MongoDB Atlas 512MB free tier, expected to last how long?
   - [ ] MVP only (< 1000 users)
   - [ ] Scale to 10k users (need M2 tier)
   - [ ] Scale to 50k+ users (need M10+ tier)

2. **External Storage**: Should we integrate Cloudinary/ImageKit now or later?
   - [ ] Now (prevent data migration later)
   - [ ] Later (optimize when needed)
   - [ ] Never (stay on GridFS)

### Archival Policy
3. **Archival Timing**: Confirm auto-archive after:
   - [ ] 30 days for completed posts
   - [ ] 90 days for inactive posts
   - [ ] Different timing: _____________

4. **Archive Access**: Should users be able to view their archived posts?
   - [ ] Yes (read-only)
   - [ ] No (delete permanently)

### Data Retention
5. **User Data Deletion**: GDPR compliance - delete all user data on account deletion?
   - [ ] Yes (complete deletion)
   - [ ] No (anonymize only)

---

## 📁 Implementation Files

### New Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `backend/models/Notification.ts` | Notification schema | 🔴 HIGH |
| `backend/models/SuccessStory.ts` | Success stories schema | 🟡 MEDIUM |
| `backend/models/ArchivedPost.ts` | Archived posts schema | 🟡 MEDIUM |
| `backend/models/SearchAlert.ts` | Search alerts schema | 🟡 MEDIUM |
| `backend/jobs/archivalJob.ts` | Cron job for archival | 🟡 MEDIUM |
| `backend/jobs/storageMonitor.ts` | Storage monitoring | 🟢 LOW |
| `backend/scripts/migrateToAtlas.js` | Migration script | 🔴 HIGH |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `backend/models/User.ts` | Add preferences, lastLogin | 🟡 MEDIUM |
| `backend/config/db.ts` | Update for Atlas | 🔴 HIGH |
| `backend/models/index.ts` | Export new models | 🔴 HIGH |

---

*Last updated: December 24, 2025*
