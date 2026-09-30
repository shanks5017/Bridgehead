import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Discovery, DiscoveryConfig } from '../zonek-core/src/engine/discovery.js';
import { Extractor } from '../zonek-core/src/engine/extractor.js';
import { ListingService } from '../zonek-core/src/database/listingService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function testBangalore() {
  try {
    console.log("🧪 STARTING BANGALORE TEST RUN...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to DB.");

    const extractor = new Extractor();
    const cityName = 'Bangalore';
    
    // Load config
    const configPath = new URL('../zonek-core/src/bangalore.json', import.meta.url);
    const configData = JSON.parse(await fs.readFile(configPath, 'utf8')) as DiscoveryConfig;
    
    // LIMIT TO FIRST 2 CATEGORIES FOR TEST
    configData.atomicUnits[0].categories = configData.atomicUnits[0].categories.slice(0, 2);
    
    const discovery = new Discovery(configData);
    const searchTargets = discovery.generateUrls('justdial');

    for (const target of searchTargets) {
      console.log(`\n📂 TESTING: [${target.area}] - [${target.category}]`);
      const items = await extractor.extractFromUrl(target.url, 'justdial');
      console.log(`📡 Captured ${items.length} items.`);

      if (items.length > 0) {
        console.log(`💾 Syncing to Bangalore_List...`);
        const seenIds: string[] = [];
        for (const item of items) {
          await ListingService.upsertRawListing(cityName, 'justdial', target.category, target.area, item);
          seenIds.push(item._id);
        }
        await ListingService.softDeleteMissing(cityName, 'justdial', target.area, target.category, seenIds);
        console.log(`✅ Sync Complete.`);
      }
    }

    console.log("\n🧪 TEST COMPLETED.");
  } catch (err) {
    console.error("🧪 TEST FAILED:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testBangalore();
