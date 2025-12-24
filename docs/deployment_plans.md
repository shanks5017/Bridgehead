# 🚀 Deployment Plans - Bridgehead

> **Document Version**: 1.0  
> **Last Updated**: December 24, 2025  
> **Parent Document**: [plans.md](file:///d:/og%20project/Bridgehead/docs/plans.md)  
> **Priority**: 🔴 HIGH

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [Deployment Options Analysis](#deployment-options-analysis)
3. [Oracle Cloud Free Tier Setup](#oracle-cloud-free-tier-setup)
4. [Alternative: Railway Deployment](#alternative-railway-deployment)
5. [Domain & SSL Configuration](#domain--ssl-configuration)
6. [Environment Configuration](#environment-configuration)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Logging](#monitoring--logging)
9. [Questions for Clarification](#questions-for-clarification)

---

## 📍 Current State

### Local Development Setup

| Component | Port | Technology |
|-----------|------|------------|
| Frontend | 3000 | Vite dev server |
| Backend | 5001 | Express.js |
| Database | 27017 | MongoDB local |

### Current Scripts

```json
// Root package.json
{
  "dev": "vite",           // Frontend: Port 3000
  "build": "vite build",   // Production bundle
  "preview": "vite preview"
}

// backend/package.json
{
  "dev": "ts-node-dev --respawn server.ts",  // Hot reload
  "build": "tsc",                             // Compile TS
  "start": "node dist/server.js"              // Production
}
```

---

## 🔍 Deployment Options Analysis

### Option 1: Oracle Cloud Free Tier (Recommended for MVP)

| Aspect | Rating | Details |
|--------|--------|---------|
| **Compute** | ⭐⭐⭐⭐ | 4 ARM cores, 24GB RAM (Always Free) |
| **Storage** | ⭐⭐⭐ | 200GB block storage |
| **Network** | ⭐⭐⭐⭐ | 10TB/month egress |
| **Reliability** | ⭐⭐⭐ | Good, but less than AWS/GCP |
| **Cost** | ⭐⭐⭐⭐⭐ | $0/month (forever free) |

**Best For**: MVP, testing, development with real users

### Option 2: Railway

| Aspect | Rating | Details |
|--------|--------|---------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | One-click deploy from GitHub |
| **Compute** | ⭐⭐⭐ | Shared resources |
| **Scaling** | ⭐⭐⭐⭐ | Auto-scaling available |
| **Cost** | ⭐⭐⭐ | $5-20/month (Hobby) |

**Best For**: Quick deployment, less DevOps overhead

### Option 3: Vercel + Railway Combo

| Aspect | Rating | Details |
|--------|--------|---------|
| **Frontend** | ⭐⭐⭐⭐⭐ | Vercel (optimized for React) |
| **Backend** | ⭐⭐⭐⭐ | Railway (Node.js hosting) |
| **Cost** | ⭐⭐⭐⭐ | $5-20/month combined |

**Best For**: Optimized frontend performance

### Option 4: DigitalOcean App Platform

| Aspect | Rating | Details |
|--------|--------|---------|
| **Compute** | ⭐⭐⭐⭐ | Dedicated resources available |
| **Scaling** | ⭐⭐⭐⭐ | Easy horizontal scaling |
| **Cost** | ⭐⭐⭐ | $12-48/month |

**Best For**: Production with growth potential

### Recommendation Matrix

| Stage | Recommended | Cost | Why |
|-------|-------------|------|-----|
| MVP (0-1k users) | Oracle Free | $0 | Test with real users, no cost |
| Growth (1k-10k) | Railway | $20-50 | Easy scaling, managed |
| Production (10k+) | DigitalOcean | $50-200 | Full control, dedicated |

---

## 🌐 Oracle Cloud Free Tier Setup

### Step 1: Create Oracle Cloud Account

```bash
# 1. Go to https://www.oracle.com/cloud/free/
# 2. Sign up with valid credit card (not charged)
# 3. Select home region (closest to users)
# 4. Wait for approval (usually instant)
```

### Step 2: Create Compute Instance

```bash
# Instance Configuration:
Shape: VM.Standard.A1.Flex (ARM)
OCPUs: 2-4 (within free tier)
Memory: 12-24 GB
Boot Volume: 100GB

# Operating System:
Oracle Linux 8 or Ubuntu 22.04

# Network:
Create VCN with public subnet
Assign public IP
```

### Step 3: Configure Security Lists

```bash
# Ingress Rules (Open Ports):
Port 22   - SSH
Port 80   - HTTP
Port 443  - HTTPS
Port 3000 - Frontend (dev only, remove in prod)
Port 5001 - Backend API (dev only, remove in prod)
```

### Step 4: Install Dependencies

```bash
# SSH into instance
ssh -i ~/.ssh/oracle_key opc@<PUBLIC_IP>

# Update system
sudo dnf update -y

# Install Node.js 20 (LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo dnf install -y git

# Install Nginx
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 5: Deploy Application

```bash
# Clone repository
cd /home/opc
git clone https://github.com/shanks5017/Bridgehead.git
cd Bridgehead

# Install dependencies
npm install
cd backend && npm install && cd ..

# Build frontend
npm run build

# Build backend
cd backend && npm run build && cd ..

# Setup environment
cp .env.example .env
cp backend/.env.example backend/.env
# Edit .env files with production values
```

### Step 6: Configure PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bridgehead-api',
      script: './backend/dist/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G'
    }
  ]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on reboot
```

### Step 7: Configure Nginx

```nginx
# /etc/nginx/conf.d/bridgehead.conf

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=static:10m rate=100r/s;

# Upstream for backend
upstream bridgehead_api {
    server 127.0.0.1:5001;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    
    # Frontend static files
    location / {
        root /home/opc/Bridgehead/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            limit_req zone=static burst=50 nodelay;
        }
    }
    
    # API proxy
    location /api {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://bridgehead_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.io
    location /socket.io {
        proxy_pass http://bridgehead_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Image uploads (GridFS served via API)
    location /api/images {
        proxy_pass http://bridgehead_api;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 🚂 Alternative: Railway Deployment

### Step 1: Connect GitHub Repository

```bash
# 1. Go to https://railway.app
# 2. Login with GitHub
# 3. New Project → Deploy from GitHub repo
# 4. Select shanks5017/Bridgehead
```

### Step 2: Configure Services

```yaml
# railway.toml (in repo root)
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[[services]]
name = "bridgehead-api"
root = "backend"
```

### Step 3: Set Environment Variables

```bash
# In Railway Dashboard → Variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
NODE_ENV=production
GEMINI_API_KEY=your-key
FRONTEND_URL=https://your-domain.up.railway.app
```

### Step 4: Add Custom Domain

```bash
# Railway Dashboard → Settings → Domains
# Add custom domain: bridgehead.com
# Configure DNS:
#   Type: CNAME
#   Name: @
#   Value: your-app.up.railway.app
```

---

## 🔐 Domain & SSL Configuration

### Domain Setup Checklist

1. **Purchase Domain** (Namecheap, GoDaddy, Google Domains)
   - Recommended: `bridgehead.app` or `bridgehead.io`
   - Cost: ~$12-15/year

2. **Configure DNS Records**

```dns
# A Record (if using Oracle with static IP)
Type: A
Name: @
Value: <ORACLE_PUBLIC_IP>
TTL: 3600

# CNAME for www
Type: CNAME
Name: www
Value: bridgehead.com
TTL: 3600

# If using Railway
Type: CNAME
Name: @
Value: your-app.up.railway.app
```

3. **SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d bridgehead.com -d www.bridgehead.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 🔧 Environment Configuration

### Production Environment Variables

```env
# backend/.env.production

# Server
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://bridgehead.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bridgehead?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secure-64-char-secret-key-here
JWT_EXPIRE=7d

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@bridgehead.com
EMAIL_PASS=app-specific-password

# Optional: Redis (for production rate limiting)
REDIS_URL=redis://default:password@redis-host:6379

# Optional: External Storage
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
```

### Frontend Environment

```env
# .env.production

VITE_API_URL=https://bridgehead.com/api
VITE_SOCKET_URL=https://bridgehead.com
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy Bridgehead

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run linter
        run: cd backend && npm run lint
      
      - name: Run tests
        run: cd backend && npm test
        env:
          MONGODB_URI: ${{ secrets.TEST_MONGODB_URI }}
          JWT_SECRET: test-secret

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Build frontend
        run: |
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Build backend
        run: |
          cd backend
          npm ci
          npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            dist/
            backend/dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build
      
      - name: Deploy to Oracle Cloud
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.ORACLE_HOST }}
          username: opc
          key: ${{ secrets.ORACLE_SSH_KEY }}
          script: |
            cd /home/opc/Bridgehead
            git pull origin main
            npm ci
            cd backend && npm ci && npm run build && cd ..
            npm run build
            pm2 reload all
```

### Deployment Commands (Manual)

```bash
# Production deployment script
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci
cd backend && npm ci && cd ..

# Build
npm run build
cd backend && npm run build && cd ..

# Reload PM2 (zero-downtime)
pm2 reload all

echo "✅ Deployment complete!"
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Logs
pm2 logs bridgehead-api

# Metrics dashboard
pm2 plus  # Paid service, optional
```

### Application Logging

```typescript
// backend/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bridgehead-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Health Check Endpoint

```typescript
// backend/routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

### Uptime Monitoring (Free)

| Service | Features | Cost |
|---------|----------|------|
| UptimeRobot | 50 monitors, 5-min interval | $0 |
| Better Uptime | 10 monitors, 3-min interval | $0 |
| Cronitor | 5 monitors | $0 |

---

## ❓ Questions for Clarification

> **Please answer these before deployment:**

### Infrastructure
1. **Deployment Platform**: Which do you prefer?
   - [ ] Oracle Cloud Free Tier (free, more setup)
   - [ ] Railway (paid, easier)
   - [ ] DigitalOcean (paid, full control)
   - [ ] Other: _____________

2. **Domain Name**: Do you have one ready?
   - [ ] Yes: _____________
   - [ ] No, need to purchase
   - [ ] Use provided subdomain for now

### Budget
3. **Monthly Budget**: What's the infrastructure budget?
   - [ ] $0 (free tier only)
   - [ ] $10-20/month
   - [ ] $50-100/month
   - [ ] More: _____________

### Timeline
4. **Deployment Timeline**: When do you need to go live?
   - [ ] ASAP (within a week)
   - [ ] 2-4 weeks
   - [ ] No rush, whenever ready

### CI/CD
5. **Continuous Deployment**: Enable auto-deploy on push to main?
   - [ ] Yes (recommended)
   - [ ] No (manual deployments)

---

## 📁 Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `ecosystem.config.js` | PM2 cluster configuration | 🔴 HIGH |
| `.github/workflows/deploy.yml` | CI/CD pipeline | 🟡 MEDIUM |
| `deploy.sh` | Manual deployment script | 🔴 HIGH |
| `nginx/bridgehead.conf` | Nginx configuration | 🔴 HIGH |
| `.env.production.example` | Production env template | 🔴 HIGH |
| `backend/routes/health.ts` | Health check endpoint | 🟡 MEDIUM |
| `backend/utils/logger.ts` | Winston logging | 🟡 MEDIUM |

---

*Last updated: December 24, 2025*
