import mongoose from 'mongoose';
import { getListingModel, ScrapingStatus } from './database/schema.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function resetTirupurIncomplete() {
  try {
    await mongoose.connect(MONGODB_URI);
    const cityName = 'Tirupur';
    const ListingModel = getListingModel(cityName);

    const configPath = new URL(`./tirupur.json`, import.meta.url);
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const categories = Object.keys(
      configData.atomicUnits.reduce((acc: any, unit: any) => {
        unit.categories.forEach((cat: string) => acc[cat] = true);
        return acc;
      }, {})
    );

    console.log(`\n🔄 Resetting incomplete categories for: ${cityName}`);
    
    let resetCount = 0;
    for (const category of categories) {
      const count = await ListingModel.countDocuments({ category, status: 'active' });
      
      // If count is less than 40, we assume it's incomplete and reset it to try again
      if (count < 40) {
        await ScrapingStatus.findOneAndUpdate(
          { cityName, type: 'list', category },
          { status: 'pending', lastScrapedAt: new Date() },
          { upsert: true }
        );
        resetCount++;
        console.log(`♻️  Resetting [${category}]: Current Count=${count}`);
      }
    }

    // Also reset city-level status to pending
    await ScrapingStatus.findOneAndUpdate(
      { cityName, type: 'list', category: { $exists: false } },
      { status: 'pending', lastScrapedAt: new Date() },
      { upsert: true }
    );

    console.log(`\n🏁 Done! Reset ${resetCount} categories in Tirupur.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("🚨 Debug Error:", error);
  }
}

resetTirupurIncomplete();
