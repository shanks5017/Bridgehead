import mongoose from 'mongoose';
import { getListingModel } from './database/schema.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function repair() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔌 Connected to database for repair...");

  const cities = [
    'Bangalore',
    'Chennai',
    'Madurai',
    'Coimbatore',
    'Trichy',
    'Salem',
    'Tirupur',
    'Vellore'
  ];

  for (const city of cities) {
    try {
      const ListingModel = getListingModel(city);
      const result = await ListingModel.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'active' } }
      );
      
      if (result.matchedCount > 0) {
        console.log(`✅ ${city}_List: Updated ${result.modifiedCount}/${result.matchedCount} records to status: 'active'`);
      } else {
        // Double check if they have status: null or just need force update
        const result2 = await ListingModel.updateMany(
            { status: { $ne: 'active' } },
            { $set: { status: 'active' } }
        );
        if (result2.modifiedCount > 0) {
            console.log(`✅ ${city}_List: Force-Updated ${result2.modifiedCount} records to status: 'active'`);
        }
      }
    } catch (e: any) {
      // Collection might not exist yet for some cities
    }
  }

  console.log("🏁 Repair complete.");
  await mongoose.disconnect();
}

repair().catch(console.error);
