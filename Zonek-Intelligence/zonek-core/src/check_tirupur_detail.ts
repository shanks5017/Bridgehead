import mongoose from 'mongoose';
import { getListingModel, ScrapingStatus } from './database/schema.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkTirupurDetail() {
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

    console.log(`\n📊 City: ${cityName}`);
    
    for (const category of categories) {
      const count = await ListingModel.countDocuments({ category, status: 'active' });
      const statusRecord = await ScrapingStatus.findOne({ cityName, type: 'list', category });
      const status = statusRecord ? statusRecord.status : 'pending';
      
      if (count < 10) {
        console.log(`⚠️  Category [${category}]: Count=${count}, Status=${status}`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("🚨 Debug Error:", error);
  }
}

checkTirupurDetail();
