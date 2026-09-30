import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getListingModel, getAdsModel, ScrapingStatus } from '../zonek-core/src/database/schema.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function debug() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.");

    const cityName = 'Chennai';
    const ListingModel = getListingModel(cityName);
    const AdsModel = getAdsModel(cityName);

    const totalListings = await ListingModel.countDocuments({ source: 'justdial', status: 'active' });
    const totalAds = await AdsModel.countDocuments({ source: 'justdial' });

    console.log(`\n📊 City: ${cityName}`);
    console.log(`📌 Total active listings: ${totalListings}`);
    console.log(`📌 Total enriched ads: ${totalAds}`);
    console.log(`📌 Missing ads: ${totalListings - totalAds}`);

    // Check categories
    const configPath = path.resolve('zonek-core/src/chennai.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const categories = Object.keys(
      configData.atomicUnits.reduce((acc: any, unit: any) => {
        unit.categories.forEach((cat: string) => acc[cat] = true);
        return acc;
      }, {})
    );

    console.log(`\n📂 Categories count: ${categories.length}`);

    for (const category of categories) {
      const listingCount = await ListingModel.countDocuments({ category, status: 'active' });
      const adsCount = await AdsModel.countDocuments({ category });
      const statusRecord = await ScrapingStatus.findOne({ cityName, type: 'ads', category });
      const status = statusRecord ? statusRecord.status : 'pending';

      if (listingCount > adsCount) {
        console.log(`⚠️  Category [${category}]: Listings=${listingCount}, Ads=${adsCount}, Status=${status} (INCOMPLETE)`);
      } else {
        // console.log(`✅ Category [${category}]: Listings=${listingCount}, Ads=${adsCount}, Status=${status}`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("🚨 Debug Error:", error);
  }
}

debug();
