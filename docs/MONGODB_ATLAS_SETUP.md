# MongoDB Atlas Setup Guide

This guide explains how to set up MongoDB Atlas (free cloud MongoDB) for deploying your Bridgehead application.

## Why MongoDB Atlas?

en you deploy your app to a hosting service (Heroku, Vercel, Railway, etc.):
- Your laptop is NOT the server
- The app runs on the hosting provider's servers
- Local MongoDB on your laptop is NOT accessible
- You need a cloud database that's always available

**MongoDB Atlas** is the perfect solution:
- ✅ Free tier: 512MB storage
- ✅ Always online (24/7)
- ✅ Same MongoDB, just in the cloud
- ✅ No code changes needed

---

## Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google account
3. Select **FREE** tier (M0)
4. Choose a cloud provider (AWS recommended) and region closest to you
5. Name your cluster (e.g., "bridgehead-cluster")
6. Click **Create Cluster** (takes 3-5 minutes)

---

## Step 2: Create Database User

1. In Atlas dashboard, go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Username: `bridgehead-user` (or your choice)
5. Password: **Auto-generate** and **copy it** (save somewhere safe!)
6. Database User Privileges: **Atlas admin**
7. Click **Add User**

---

## Step 3: Allow Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
   - ⚠️ For production, use specific IPs for better security
4. Click **Confirm**

---

## Step 4: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 5: Update Your .env File

### For Local Development (current):
```env
MONGODB_URI=mongodb://localhost:27017/bridgehead
```

### For Production/Deployment:
```env
MONGODB_URI=mongodb+srv://bridgehead-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bridgehead?retryWrites=true&w=majority
```

**Replace:**
- `<username>` with your database username
- `<password>` with your database password
- Add `/bridgehead` before the `?` to specify database name

**Example:**
```env
MONGODB_URI=mongodb+srv://bridgehead-user:Abc123xyz@cluster0.ab1cd.mongodb.net/bridgehead?retryWrites=true&w=majority
```

---

## Step 6: Migrate Data (Optional)

### Option 1: Start Fresh
- Deploy with empty database
- Users create new data directly on production

### Option 2: Export/Import via MongoDB Compass

**Export from Local:**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select `bridgehead` database
4. For each collection (users, demandposts, etc.):
   - Click collection → Export Data → Export Full Collection
   - Save as JSON

**Import to Atlas:**
1. In Compass, click **New Connection**
2. Paste Atlas connection string
3. Click **Connect**
4. Select `bridgehead` database (create if needed)
5. For each collection:
   - Click **Add Data** → Import File
   - Select exported JSON file
   - Click **Import**

### Option 3: Export/Import via Command Line

**Export from local:**
```bash
mongodump --db bridgehead --out ./backup
```

**Import to Atlas:**
```bash
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bridgehead" ./backup/bridgehead
```

---

## Step 7: Test Connection Locally

Before deploying, test Atlas connection from your local machine:

1. Create `.env.atlas` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bridgehead?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

2. Temporarily rename your `.env` to `.env.local`
3. Rename `.env.atlas` to `.env`
4. Run backend: `npm run dev`
5. If it connects successfully, you're ready to deploy! ✅
6. Restore `.env.local` back to `.env` for local development

---

## Security Best Practices

1. **Never commit .env file** (already in .gitignore)
2. **Use environment variables** on hosting platform
3. **Rotate passwords** regularly
4. **Whitelist specific IPs** in production (not 0.0.0.0/0)
5. **Enable 2FA** on MongoDB Atlas account

---

## Deployment Platforms Setup

### Heroku
1. Go to app settings → Config Vars
2. Add: `MONGODB_URI` = your Atlas connection string
3. Add other vars: `JWT_SECRET`, `NODE_ENV=production`

### Vercel
1. Project Settings → Environment Variables
2. Add: `MONGODB_URI` = your Atlas connection string
3. Add other vars

### Railway
1. Variables tab
2. Add: `MONGODB_URI` = your Atlas connection string
3. Add other vars

---

## Troubleshooting

### "Authentication failed"
- Check username/password in connection string
- Verify user exists in Database Access

### "Connection timeout"
- Check Network Access whitelist
- Try 0.0.0.0/0 for testing

### "Database not found"
- Add `/bridgehead` to connection string before `?`
- Create database manually in Atlas

### "Too many connections"
- Free tier has connection limits
- Make sure to close connections properly
- Use connection pooling (already handled by Mongoose)

---

## Monitoring

In MongoDB Atlas dashboard:
- **Metrics** tab: View database performance
- **Collections**: Browse your data
- **Logs**: View database logs
- **Alerts**: Set up email alerts for issues

---

## Cost

- **Free Tier (M0)**: 512MB storage, shared RAM, sufficient for small apps
- **Upgrade**: When you need more, upgrade to M10 (~$0.08/hour)

---

## 🎉 That's It!

Your app can now work with:
- **Local MongoDB** (development): `mongodb://localhost:27017/bridgehead`
- **MongoDB Atlas** (production): `mongodb+srv://...`

Just change the `MONGODB_URI` environment variable! No code changes needed.
