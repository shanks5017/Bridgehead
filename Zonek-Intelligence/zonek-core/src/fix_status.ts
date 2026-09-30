import mongoose from 'mongoose';
import { ScrapingStatus } from './database/schema.js';
import dotenv from 'dotenv';

const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function resetCity() {
  await mongoose.connect(MONGODB_URI);
  const cityName = 'Tirupur';
  
  // Use category: null for the city-level record
  const result = await ScrapingStatus.deleteMany({ cityName, type: 'list', category: null });
  console.log(`🗑️ Deleted ${result.deletedCount} city-level status records for ${cityName} list.`);
  
  await ScrapingStatus.findOneAndUpdate(
    { cityName, type: 'list', category: null },
    { status: 'pending', lastScrapedAt: new Date() },
    { upsert: true }
  );
  console.log(`✅ City-level status for ${cityName} list is now: pending`);
  
  await mongoose.disconnect();
}

resetCity().catch(console.error);
