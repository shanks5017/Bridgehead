import mongoose from 'mongoose';
import { ScrapingStatus } from '../zonek-core/src/database/schema.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔌 Connected to DB for seeding...");

  const citiesToMarkDone = ['Bangalore', 'Chennai', 'Coimbatore'];

  for (const city of citiesToMarkDone) {
    await ScrapingStatus.findOneAndUpdate(
      { cityName: city, type: 'list', category: undefined },
      { status: 'completed', lastScrapedAt: new Date() },
      { upsert: true }
    );
    console.log(`✅ Marked ${city} List Scraper as COMPLETED.`);
  }

  await mongoose.disconnect();
  console.log("👋 Seeding finished.");
}

seed().catch(console.error);
