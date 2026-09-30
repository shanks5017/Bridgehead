# 🔒 Security Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🔴 CRITICAL

---

## 📋 Table of Contents

1. [Critical Security Issues](#critical-security-issues)
2. [API Key Protection](#api-key-protection)
3. [HTTP Security Headers](#http-security-headers)
4. [Input Sanitization](#input-sanitization)
5. [Authentication Security](#authentication-security)
6. [CORS Configuration](#cors-configuration)
7. [Rate Limiting Hardening](#rate-limiting-hardening)
8. [File Upload Security](#file-upload-security)
9. [Security Checklist](#security-checklist)
10. [Questions for Clarification](#questions-for-clarification)

---

## 🚨 Critical Security Issues

### Vulnerability Summary

| Issue | Location | Severity | Fix Time |
|-------|----------|----------|----------|
| API Key in Frontend | `Chatbot.tsx` | 🔴 CRITICAL | 4-6 hours |
| CORS Too Permissive | `server.ts` | 🔴 CRITICAL | 30 minutes |
| Missing Helmet.js | `server.ts` | 🔴 HIGH | 30 minutes |
| No MongoDB Sanitization | All controllers | 🔴 HIGH | 1 hour |
| In-Memory Rate Limiter | `rateLimiter.ts` | 🔴 HIGH | 2-3 hours |
| No CSRF Protection | All forms | 🟡 MEDIUM | 2-3 hours |
| Weak Password Policy | `authController.ts` | 🟡 MEDIUM | 1 hour |

### Immediate Actions Required

```
1. ❌ CRITICAL: Move Gemini API key to backend IMMEDIATELY
   - Currently exposed in Chatbot.tsx
   - Anyone can view and steal the key
   
2. ❌ CRITICAL: Restrict CORS to specific origins
   - Currently: origin: "*" (accepts ALL origins)
   - Attack surface: Any malicious site can make requests
   
3. ❌ HIGH: Install Helmet.js
   - No security headers being sent
   - Vulnerable to: Clickjacking, MIME sniffing, XSS
```

---

## 🔐 API Key Protection

### Current Issue

```typescript
// Chatbot.tsx - LINE ~30 ❌ DANGEROUS
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// API key is bundled into frontend code and visible to anyone!
```

### Solution: Backend AI Service

#### Step 1: Create Backend AI Controller

```typescript
// backend/controllers/aiController.ts (NEW FILE)
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const chat = async (req: Request, res: Response) => {
  const { message, history } = req.body;
  
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history || []
    });
    
    const response = await chat.sendMessage(message);
    
    res.json({
      reply: response.text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
};

export const generateIdeas = async (req: Request, res: Response) => {
  const { latitude, longitude, demands, isDeepDive } = req.body;
  
  try {
    // Existing geminiService logic moved here
    const ideas = await generateBusinessIdeas(
      { latitude, longitude },
      demands,
      isDeepDive
    );
    
    res.json({ ideas });
  } catch (error) {
    res.status(500).json({ error: 'Could not generate ideas' });
  }
};

export const findMatches = async (req: Request, res: Response) => {
  const { demands, rentals } = req.body;
  
  try {
    const matches = await matchDemandRentals(demands, rentals);
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Matching service unavailable' });
  }
};
```

#### Step 2: Create AI Routes

```typescript
// backend/routes/ai.ts (NEW FILE)
import express from 'express';
import { chat, generateIdeas, findMatches } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Rate limit: 20 requests per minute for AI endpoints
router.use(aiRateLimiter);

router.post('/chat', authMiddleware, chat);
router.post('/ideas', authMiddleware, generateIdeas);
router.post('/matches', authMiddleware, findMatches);

export default router;
```

#### Step 3: Register Routes

```typescript
// backend/server.ts (ADD)
import aiRoutes from './routes/ai';

app.use('/api/ai', aiRoutes);
```

#### Step 4: Update Frontend

```typescript
// services/geminiService.ts (UPDATED - Frontend)
const API_URL = process.env.VITE_API_URL || 'http://localhost:5001/api';

export const chatWithAI = async (message: string, history: any[]) => {
  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ message, history })
  });
  
  if (!response.ok) throw new Error('AI service failed');
  return response.json();
};

// Remove all direct GoogleGenerativeAI usage from frontend!
```

---

## 🛡️ HTTP Security Headers

### Install Helmet.js

```bash
cd backend
npm install helmet
```

### Configure Helmet

```typescript
// backend/server.ts (ADD at top, after imports)
import helmet from 'helmet';

// Apply Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://api.fontshare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.cloudinary.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "wss://"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false, // Required for loading external fonts
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

### Headers Added by Helmet

| Header | Protection Against |
|--------|-------------------|
| `X-Content-Type-Options: nosniff` | MIME sniffing attacks |
| `X-Frame-Options: DENY` | Clickjacking |
| `X-XSS-Protection: 1; mode=block` | XSS attacks |
| `Strict-Transport-Security` | HTTPS downgrade attacks |
| `Content-Security-Policy` | Script injection |
| `X-Permitted-Cross-Domain-Policies` | Adobe plugin misuse |

---

## 🧹 Input Sanitization

### Install Dependencies

```bash
cd backend
npm install express-mongo-sanitize hpp xss-clean
```

### Configure Sanitization

```typescript
// backend/server.ts (ADD)
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss-clean';

// Sanitize MongoDB queries (prevent NoSQL injection)
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['category', 'status', 'sort'] // Allow these as arrays
}));

// Sanitize user input (prevent XSS)
app.use(xss());
```

### Example: NoSQL Injection Prevention

```javascript
// ATTACK ATTEMPT:
// POST /api/auth/login
// { "email": { "$gt": "" }, "password": { "$gt": "" } }

// Without mongoSanitize: ❌ Logs in as first user in DB!
// With mongoSanitize: ✅ { "email": "_gt_", "password": "_gt_" } → Invalid login
```

### Manual Sanitization for Sensitive Fields

```typescript
// backend/utils/sanitize.ts (NEW FILE)
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
};

export const sanitizeUsername = (username: string): string => {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]/g, ''); // Only alphanumeric, dots, underscores
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
```

---

## 🔑 Authentication Security

### Strengthen Password Policy

```typescript
// backend/controllers/authController.ts (UPDATE)
const PASSWORD_REQUIREMENTS = {
  minLength: 8,       // Was 6
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false // Optional
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
};
```

### Add Refresh Tokens

```typescript
// backend/services/tokenService.ts (NEW FILE)
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_TOKEN_EXPIRY = '15m';   // Short-lived
const REFRESH_TOKEN_EXPIRY = '7d';   // Long-lived

export const generateTokenPair = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Optional: Check if refresh token is blacklisted (redis)
    
    return generateTokenPair(decoded.userId);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
```

### Account Lockout

```typescript
// backend/middleware/accountLockout.ts (NEW FILE)
import redis from '../config/redis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

export const checkAccountLockout = async (email: string): Promise<boolean> => {
  const key = `lockout:${email}`;
  const attempts = await redis.get(key);
  return parseInt(attempts || '0') >= MAX_ATTEMPTS;
};

export const recordFailedAttempt = async (email: string): Promise<number> => {
  const key = `lockout:${email}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    await redis.expire(key, LOCKOUT_DURATION);
  }
  
  return MAX_ATTEMPTS - attempts;
};

export const clearLockout = async (email: string): Promise<void> => {
  await redis.del(`lockout:${email}`);
};
```

---

## 🌐 CORS Configuration

### Current Issue

```typescript
// backend/server.ts - ❌ DANGEROUS
app.use(cors()); // Allows ALL origins!
```

### Secure Configuration

```typescript
// backend/server.ts (REPLACE)
import cors from 'cors';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,           // e.g., 'https://bridgehead.com'
  'http://localhost:3000',            // Development
  'http://localhost:5173',            // Vite dev
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,                    // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Remaining'],
  maxAge: 86400                         // Cache preflight for 24h
}));
```

### Environment Variable

```env
# backend/.env
FRONTEND_URL=https://bridgehead.com

# For multiple origins (comma-separated)
ALLOWED_ORIGINS=https://bridgehead.com,https://www.bridgehead.com
```

---

## ⏱️ Rate Limiting Hardening

### Tiered Rate Limits

```typescript
// backend/middleware/rateLimiter.ts (COMPREHENSIVE UPDATE)
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

const createLimiter = (options: any) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};

// General API: 100 requests / 15 minutes
export const apiRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});

// Auth endpoints: 5 attempts / minute
export const authRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please wait 1 minute.' }
});

// Password reset: 3 attempts / hour
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset attempts. Please wait 1 hour.' }
});

// AI endpoints: 20 requests / minute (expensive operations)
export const aiRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI rate limit reached. Please wait before trying again.' }
});

// File uploads: 10 / minute
export const uploadRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads. Please slow down.' }
});
```

---

## 📁 File Upload Security

### Current Security (Good)

```typescript
// Already implemented in uploadMiddleware.ts:
✅ File type validation (magic numbers)
✅ File size limits
✅ GridFS storage (not filesystem)
```

### Additional Hardening

```typescript
// backend/middleware/uploadMiddleware.ts (ENHANCE)
import fileType from 'file-type';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const validateUpload = async (file: Express.Multer.File) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  // Validate magic numbers (not just extension)
  const type = await fileType.fromBuffer(file.buffer);
  
  if (!type || !ALLOWED_TYPES.includes(type.mime)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.');
  }
  
  // Check for malicious content
  const header = file.buffer.toString('utf8', 0, 100);
  if (header.includes('<script') || header.includes('javascript:')) {
    throw new Error('Potentially malicious file detected.');
  }
  
  return true;
};
```

---

## ✅ Security Checklist

### Pre-Deployment Checklist

```markdown
## Server Security
- [ ] Helmet.js installed and configured
- [ ] CORS restricted to allowed origins only
- [ ] All security headers present (check with securityheaders.com)
- [ ] Rate limiting on all endpoints
- [ ] Request body size limited
- [ ] HTTPS enforced (redirect HTTP)

## Authentication
- [ ] All API keys in environment variables
- [ ] Frontend has NO direct API keys
- [ ] JWT secret is strong (64+ chars, random)
- [ ] Password requirements enforced (8+ chars, mixed)
- [ ] Account lockout after failed attempts
- [ ] Refresh token rotation implemented

## Input Validation
- [ ] All inputs validated (express-validator)
- [ ] MongoDB queries sanitized (mongo-sanitize)
- [ ] XSS prevention on rendered content
- [ ] SQL/NoSQL injection prevented

## File Uploads
- [ ] File type validated (magic numbers)
- [ ] File size limited
- [ ] Malicious content scanning
- [ ] Uploads stored securely (GridFS)

## Monitoring
- [ ] Failed login attempts logged
- [ ] Rate limit violations logged
- [ ] Error tracking configured
- [ ] Security incident alerts
```

---

## ❓ Questions for Clarification

> **Please answer these before implementation:**

### Authentication
1. **Password Policy**: Confirm strength requirements:
   - [ ] Current (6 chars minimum)
   - [ ] Moderate (8 chars, 1 uppercase, 1 number)
   - [ ] Strong (10 chars, all types required)

2. **Refresh Tokens**: Implement token refresh flow?
   - [ ] Yes (more secure, more complex)
   - [ ] No (simpler, less secure)

3. **Account Lockout**: After how many failed attempts?
   - [ ] 3 attempts → 15 min lockout
   - [ ] 5 attempts → 15 min lockout
   - [ ] 10 attempts → 30 min lockout

### CSRF Protection
4. **CSRF Tokens**: Implement for forms?
   - [ ] Yes (recommended for sensitive actions)
   - [ ] No (rely on SameSite cookies + CORS)

### Monitoring
5. **Security Logging**: What level?
   - [ ] Basic (failed logins only)
   - [ ] Standard (+ rate limits, auth attempts)
   - [ ] Comprehensive (+ all requests)

---

## 📁 Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `backend/controllers/aiController.ts` | Backend AI service | 🔴 CRITICAL |
| `backend/routes/ai.ts` | AI API routes | 🔴 CRITICAL |
| `backend/services/tokenService.ts` | Token management | 🟡 MEDIUM |
| `backend/middleware/accountLockout.ts` | Brute force protection | 🟡 MEDIUM |
| `backend/utils/sanitize.ts` | Input sanitization | 🔴 HIGH |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `backend/server.ts` | Add helmet, cors, sanitization | 🔴 CRITICAL |
| `backend/middleware/rateLimiter.ts` | Redis + tiered limits | 🔴 HIGH |
| `backend/controllers/authController.ts` | Password policy | 🟡 MEDIUM |
| `Chatbot.tsx` | Remove API key, use backend | 🔴 CRITICAL |
| `services/geminiService.ts` | Frontend: API calls only | 🔴 CRITICAL |

---

*Last updated: December 24, 2025*
