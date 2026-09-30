import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ScrapingStatus } from './database/schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function resetCities(cities: string[]) {
  try {
    console.log(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.");

    for (const cityName of cities) {
      console.log(`\n🔄 Resetting status for City: ${cityName}...`);
      
      // Reset city-level status for 'list' type
      const result = await ScrapingStatus.findOneAndUpdate(
        { 
          cityName, 
          type: 'list', 
          $or: [{ category: { $exists: false } }, { category: null }] 
        },
        { status: 'pending', lastScrapedAt: new Date() },
        { upsert: true, new: true }
      );
      
      console.log(`✅ City-level status for ${cityName} is now: ${result.status}`);
    }

    console.log(`\n🏁 All requested cities have been reset.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("🚨 Error during reset:", error);
    process.exit(1);
  }
}

const citiesToReset = ['Madurai', 'Trichy'];
resetCities(citiesToReset);
