# ✨ Features Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🟡 MEDIUM

---

## 📋 Table of Contents

1. [Feature Backlog Summary](#feature-backlog-summary)
2. [Google OAuth Integration](#google-oauth-integration)
3. [Username Login Support](#username-login-support)
4. [Notification System](#notification-system)
5. [Success Stories Feature](#success-stories-feature)
6. [Search Alerts](#search-alerts)
7. [Google Analytics Integration](#google-analytics-integration)
8. [Questions for Clarification](#questions-for-clarification)

---

## 📊 Feature Backlog Summary

### Missing Features by Priority

| Feature | Current Status | Priority | Estimated Time |
|---------|----------------|----------|----------------|
| Username Login | ❌ Email only | 🔴 HIGH | 2-3 hours |
| Google OAuth | ⚠️ UI exists, backend missing | 🔴 HIGH | 4-6 hours |
| Notification System | ⚠️ Basic Socket.io only | 🔴 HIGH | 6-8 hours |
| Success Stories | ❌ Not implemented | 🟡 MEDIUM | 4-6 hours |
| Search Alerts | ❌ Not implemented | 🟡 MEDIUM | 4-5 hours |
| Google Analytics | ❌ Not implemented | 🟢 LOW | 1 hour |
| Microsoft OAuth | ❌ Not implemented | 🟢 LOW | 4-6 hours |
| Push Notifications | ❌ Not implemented | 🟢 LOW | 6-8 hours |

---

## 🔐 Google OAuth Integration

### Current State

```typescript
// SignIn.tsx & SignUp.tsx - Line ~50
const handleSocialSignIn = (provider: string) => {
  console.log(`Sign in with ${provider}`); // ❌ Not implemented!
};
```

### Implementation Plan

#### Step 1: Setup Google Cloud Console

```plaintext
1. Go to https://console.cloud.google.com
2. Create new project: "Bridgehead"
3. APIs & Services → OAuth consent screen
   - User Type: External
   - App name: Bridgehead
   - Scopes: email, profile, openid
4. Credentials → Create OAuth 2.0 Client ID
   - Type: Web application
   - Authorized redirect URIs:
     - http://localhost:5001/api/auth/google/callback (dev)
     - https://bridgehead.com/api/auth/google/callback (prod)
5. Save Client ID and Client Secret
```

#### Step 2: Install Dependencies

```bash
cd backend
npm install passport passport-google-oauth20 @types/passport-google-oauth20
```

#### Step 3: Create Passport Strategy

```typescript
// backend/config/passport.ts (NEW FILE)
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ 
        authProviderId: profile.id, 
        authProvider: 'google' 
      });
      
      if (!user) {
        // Check if email already registered
        const existingUser = await User.findOne({ email: profile.emails?.[0].value });
        
        if (existingUser) {
          // Link Google to existing account
          existingUser.authProvider = 'google';
          existingUser.authProviderId = profile.id;
          await existingUser.save();
          return done(null, existingUser);
        }
        
        // Create new user
        user = await User.create({
          fullName: profile.displayName,
          email: profile.emails?.[0].value,
          username: `user_${profile.id.slice(-8)}`, // Generate temp username
          authProvider: 'google',
          authProviderId: profile.id,
          profilePicture: profile.photos?.[0].value,
          verified: true // Google emails are verified
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error, undefined);
    }
  }
));

export default passport;
```

#### Step 4: Add OAuth Routes

```typescript
// backend/routes/auth.ts (ADD)
import passport from '../config/passport';

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const user = req.user as IUser;
    
    // Generate JWT
    const token = user.getSignedJwtToken();
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
```

#### Step 5: Frontend Handling

```typescript
// components/AuthCallback.tsx (NEW FILE)
import { useEffect } from 'react';

export const AuthCallback = ({ onAuthSuccess }) => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('authToken', token);
      onAuthSuccess();
    }
  }, []);
  
  return <div>Signing in...</div>;
};

// Update SignIn.tsx
const handleSocialSignIn = (provider: string) => {
  window.location.href = `${API_URL}/auth/${provider}`;
};
```

---

## 👤 Username Login Support

### Current State

```typescript
// authController.ts - login function
const user = await User.findOne({ email: email.toLowerCase() });
// ❌ Only checks email, not username
```

### Implementation

```typescript
// backend/controllers/authController.ts (UPDATE login function)
export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body; // Changed from 'email' to 'identifier'
  
  // Validate input
  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email/username and password'
    });
  }
  
  // Normalize identifier
  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  // Check if it's an email or username
  const isEmail = normalizedIdentifier.includes('@');
  
  // Find user by email OR username
  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier },
      { username: normalizedIdentifier }
    ]
  }).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
  
  // Check password
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
  
  // Generate token
  sendTokenResponse(user, 200, res);
};
```

### Frontend Update

```typescript
// components/SignIn.tsx (UPDATE)
<FormInput
  label="Email or Username"
  type="text"
  value={identifier}  // Changed from 'email'
  onChange={(e) => setIdentifier(e.target.value)}
  placeholder="Enter email or username"
  required
/>
```

---

## 🔔 Notification System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Triggers                     │
├──────────────────────────────────────────────────────────────┤
│  New Match  │  New Message  │  Upvote  │  Comment  │ System  │
└──────────────┴───────────────┴──────────┴───────────┴─────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Notification Service                      │
├──────────────────────────────────────────────────────────────┤
│  Queue │  Store in DB │  Send Real-time │  Email (optional)  │
└────────┴───────────────┴─────────────────┴────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Delivery Channels                         │
├──────────────────────────────────────────────────────────────┤
│  Socket.io (In-App)  │  Email (Nodemailer)  │  Push (later)  │
└──────────────────────┴───────────────────────┴────────────────┘
```

### Notification Model

```typescript
// backend/models/Notification.ts (NEW FILE)
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'match' | 'message' | 'upvote' | 'comment' | 'system' | 'alert';
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  type: {
    type: String,
    enum: ['match', 'message', 'upvote', 'comment', 'system', 'alert'],
    required: true
  },
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, maxlength: 500 },
  data: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false, index: true },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high'], 
    default: 'normal' 
  },
  expiresAt: Date,
}, { timestamps: true });

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// TTL index for auto-deletion
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
```

### Notification Service

```typescript
// backend/services/notificationService.ts (NEW FILE)
import Notification, { INotification } from '../models/Notification';
import { io } from '../server';
import { sendEmail } from '../utils/email';

interface CreateNotificationParams {
  userId: string;
  type: INotification['type'];
  title: string;
  body?: string;
  data?: Record<string, any>;
  priority?: INotification['priority'];
  sendEmail?: boolean;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, type, title, body, data, priority, sendEmail: shouldEmail } = params;
  
  // Create notification record
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    data,
    priority: priority || 'normal',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  // Send real-time notification via Socket.io
  io.to(`user:${userId}`).emit('notification', {
    id: notification._id,
    type,
    title,
    body,
    data,
    createdAt: notification.createdAt
  });
  
  // Send email if requested and user has email notifications enabled
  if (shouldEmail) {
    const user = await User.findById(userId);
    if (user?.preferences?.notifications?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: generateNotificationEmail(title, body, type)
      });
    }
  }
  
  return notification;
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

export const markAllAsRead = async (userId: string) => {
  return Notification.updateMany(
    { userId, read: false },
    { read: true }
  );
};

export const getUnreadCount = async (userId: string) => {
  return Notification.countDocuments({ userId, read: false });
};
```

### Notification Controller

```typescript
// backend/controllers/notificationController.ts (NEW FILE)
import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { markAsRead, markAllAsRead, getUnreadCount } from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const { cursor, limit = 20 } = req.query;
  
  const query: any = { userId };
  if (cursor) query._id = { $lt: cursor };
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string) + 1);
  
  const hasMore = notifications.length > parseInt(limit as string);
  if (hasMore) notifications.pop();
  
  res.json({
    success: true,
    data: notifications,
    pagination: {
      hasMore,
      nextCursor: hasMore ? notifications[notifications.length - 1]._id : null
    }
  });
};

export const markRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id;
  
  const notification = await markAsRead(id, userId);
  
  res.json({ success: true, data: notification });
};

export const markAllRead = async (req: Request, res: Response) => {
  const userId = req.user._id;
  
  await markAllAsRead(userId);
  
  res.json({ success: true, message: 'All notifications marked as read' });
};

export const getUnread = async (req: Request, res: Response) => {
  const userId = req.user._id;
  const count = await getUnreadCount(userId);
  
  res.json({ success: true, unreadCount: count });
};
```

---

## 🏆 Success Stories Feature

### Purpose

Showcase real success stories where community demands led to new businesses, building social proof and engagement.

### Model

See [database_plans.md](file:///d:/og%20project/Bridgehead/docs/database_plans.md#3-success-story-model-new) for full schema.

### Controller

```typescript
// backend/controllers/successStoryController.ts (NEW FILE)
import SuccessStory from '../models/SuccessStory';

export const submitStory = async (req: Request, res: Response) => {
  const { demandId, rentalId, story, metrics } = req.body;
  const userId = req.user._id;
  
  const newStory = await SuccessStory.create({
    demandId,
    rentalId,
    story,
    metrics,
    submittedBy: userId,
    status: 'pending'
  });
  
  res.status(201).json({ success: true, data: newStory });
};

export const getFeaturedStories = async (req: Request, res: Response) => {
  const stories = await SuccessStory.find({ 
    status: 'approved',
    featured: true 
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('demandId', 'title category')
    .populate('rentalId', 'title price')
    .populate('submittedBy', 'fullName profilePicture');
  
  res.json({ success: true, data: stories });
};

export const approveStory = async (req: Request, res: Response) => {
  // Admin only
  const { id } = req.params;
  const { featured } = req.body;
  
  const story = await SuccessStory.findByIdAndUpdate(
    id,
    { 
      status: 'approved', 
      featured: !!featured,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    },
    { new: true }
  );
  
  res.json({ success: true, data: story });
};
```

---

## 🔍 Search Alerts

### Purpose

Allow users to save searches and receive notifications when matching posts are created.

### Implementation

```typescript
// backend/models/SearchAlert.ts (NEW FILE)
// See database_plans.md for full schema

// backend/services/searchAlertService.ts (NEW FILE)
export const checkNewPostAgainstAlerts = async (post: IDemandPost | IRentalPost) => {
  // Find matching alerts
  const alerts = await SearchAlert.find({
    active: true,
    'query.type': post instanceof DemandPost ? 'demand' : 'rental',
    $or: [
      { 'query.category': post.category },
      { 'query.category': { $exists: false } }
    ]
  }).populate('userId');
  
  for (const alert of alerts) {
    // Check location proximity if specified
    if (alert.query.location?.coordinates) {
      const distance = calculateDistance(
        alert.query.location.coordinates,
        post.location.coordinates
      );
      if (distance > alert.query.location.radiusKm) continue;
    }
    
    // Check price range for rentals
    if (post.price && alert.query.priceRange) {
      if (post.price < alert.query.priceRange.min ||
          post.price > alert.query.priceRange.max) continue;
    }
    
    // Create notification
    await createNotification({
      userId: alert.userId._id,
      type: 'alert',
      title: `New ${post.category} posting matches your search`,
      body: post.title,
      data: { postId: post._id, type: post instanceof DemandPost ? 'demand' : 'rental' },
      sendEmail: alert.channel === 'email' || alert.channel === 'both'
    });
    
    // Update alert stats
    alert.lastTriggered = new Date();
    alert.matchCount++;
    await alert.save();
  }
};
```

---

## 📊 Google Analytics Integration

### Step 1: Get Tracking ID

```plaintext
1. Go to https://analytics.google.com
2. Create new property for "Bridgehead"
3. Get Measurement ID (G-XXXXXXXXXX)
```

### Step 2: Add to index.html

```html
<!-- index.html (ADD before </head>) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 3: Track Custom Events

```typescript
// utils/analytics.ts (NEW FILE)
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Usage examples:
trackEvent('post_created', 'demand', 'Food & Drink');
trackEvent('ai_suggestions_viewed', 'ai');
trackEvent('message_sent', 'collaboration');
```

---

## ❓ Questions for Clarification

> **Please answer these before implementation:**

### Google OAuth
1. **Google OAuth Priority**: When to implement?
   - [ ] Phase 1 (with security fixes)
   - [ ] Phase 2 (with scalability)
   - [ ] Phase 3 (with other features)

2. **Microsoft OAuth**: Need this too?
   - [ ] Yes (many business users)
   - [ ] No (Google is sufficient)

### Notifications
3. **Email Notifications**: Which events trigger emails?
   - [ ] All (match, message, upvote, comment)
   - [ ] Important only (match, message)
   - [ ] User preference (let them choose)

4. **Push Notifications**: Implement service worker?
   - [ ] Yes (modern experience)
   - [ ] No (in-app only for now)

### Success Stories
5. **Story Submission**: Who can submit?
   - [ ] Users (self-submitted, admin approved)
   - [ ] Admin only (curated)
   - [ ] Both

6. **Homepage Display**: Show featured stories?
   - [ ] Yes (social proof on landing)
   - [ ] No (separate page only)

### Analytics
7. **Analytics Provider**: Preference?
   - [ ] Google Analytics (standard)
   - [ ] Plausible (privacy-focused)
   - [ ] Both/Other: _____________

---

## 📁 Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `backend/config/passport.ts` | OAuth strategies | 🔴 HIGH |
| `backend/models/Notification.ts` | Notification schema | 🔴 HIGH |
| `backend/models/SuccessStory.ts` | Success stories schema | 🟡 MEDIUM |
| `backend/models/SearchAlert.ts` | Search alerts schema | 🟡 MEDIUM |
| `backend/services/notificationService.ts` | Notification logic | 🔴 HIGH |
| `backend/controllers/notificationController.ts` | Notification API | 🔴 HIGH |
| `backend/routes/notifications.ts` | Notification routes | 🔴 HIGH |
| `components/AuthCallback.tsx` | OAuth callback handler | 🔴 HIGH |
| `utils/analytics.ts` | Analytics utilities | 🟢 LOW |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `backend/routes/auth.ts` | Add OAuth routes | 🔴 HIGH |
| `backend/controllers/authController.ts` | Username login | 🔴 HIGH |
| `components/SignIn.tsx` | Identifier field, OAuth buttons | 🔴 HIGH |
| `components/SignUp.tsx` | OAuth buttons | 🔴 HIGH |
| `index.html` | Google Analytics script | 🟢 LOW |
| `backend/server.ts` | Register new routes | 🔴 HIGH |

---

*Last updated: December 24, 2025*
