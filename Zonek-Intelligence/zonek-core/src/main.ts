import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Discovery, DiscoveryConfig } from './engine/discovery.js';
import { Extractor } from './engine/extractor.js';
import { ListingService } from './database/listingService.js';

// Robust environment loading
const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

// 🏙️ CITIES TO PROCESS IN SEQUENCE
const CITIES_TO_PROCESS = [
  'Madurai',
  'Hyderabad',
  'Chennai',
  'Trichy',
  'Salem',
  'Kochi',
  'Tirupur',
  'Vellore'
];

async function processCity(cityName: string, extractor: Extractor): Promise<boolean> {
  try {
    console.log(`\n🌆 ==========================================`);
    console.log(`🌆 PROCESSING CITY: ${cityName.toUpperCase()}`);
    console.log(`🌆 ==========================================`);

    // 1. Load Discovery Configuration
    const configPath = new URL(`./${cityName.toLowerCase()}.json`, import.meta.url);
    const configData = JSON.parse(await fs.readFile(configPath, 'utf8')) as DiscoveryConfig;
    const discovery = new Discovery(configData);

    // 2. Generate Search Targets
    const searchTargets = discovery.generateUrls('justdial');
    console.log(`🎯 Sequential extraction engine for ${cityName} (${searchTargets.length} targets).`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const target of searchTargets) {
      try {
        // 🕵️ Granular Status Detection: Skip if already done
        const catStatus = await ListingService.getScrapingStatus(cityName, 'list', target.category);
        const existingCount = await ListingService.countExistingListings(cityName, target.category);

        if (catStatus === 'completed' || existingCount >= 40) {
          console.log(`⏭️ [SKIPPING] ${target.category} (Status: ${catStatus}, Count: ${existingCount})`);
          skippedCount++;
          continue;
        }

        await ListingService.setScrapingStatus(cityName, 'list', 'in_progress', target.category);
        
        // 🚀 REAL-TIME INCREMENTAL SYNC
        const items = await extractor.extractFromUrl(target.url, 'justdial', async (newItems) => {
          await ListingService.incrementalSync(cityName, newItems, 'justdial', target.area, target.category);
        }, 1);

        // 🏆 Strict Completion: Record only if successful
        await ListingService.setScrapingStatus(cityName, 'list', 'completed', target.category);
        successCount++;

        if (items.length > 0) {
          const finalSeenIds = items.map(i => i._id);
          await ListingService.softDeleteMissing(cityName, 'justdial', target.area, target.category, finalSeenIds);
          console.log(`✅ Sync Complete for ${target.category}.`);
        } else {
          console.log(`⚠️ No items found for ${target.category} (Scan Verified).`);
        }
        
        // Cooldown between categories
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        failCount++;
        console.error(`🚨 Error in ${target.category}:`, err.message);
        
        if (err.message && err.message.includes('BAN_DETECTED')) {
            throw err; // Escalate to trigger city-level cooldown
        }
        
        // If we hit too many consecutive connection errors in this city, abort
        if (failCount >= 10 && successCount === 0) {
           throw new Error(`FATAL_CITY_ERROR: Consecutive failures in ${cityName}.`);
        }
      }
    }

    console.log(`\n🏆 Finished processing ${cityName}. (Success: ${successCount}, Failed: ${failCount}, Skipped: ${skippedCount})`);
    
    // 🏁 A city is only "Done" if nothing failed.
    return failCount === 0 && (successCount + skippedCount > 0);
  } catch (err: any) {
    console.error(`🚨 Failed to process city ${cityName}:`, err.message);
    throw err;
  }
}

async function main() {
  try {
    // 1. Database Connection (Production Sync Mode)
    console.log("🔌 Connecting to MongoDB [PRODUCTION SYNC]...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected successfully.");

    // 2. Initialize Extractor
    const extractor = new Extractor();

    // 3. Start Multi-City Pipeline with Auto-Healing
    console.log("🚀 Starting Multi-City Raw Data Extraction Pipeline...");
    
    const cityNameArg = process.argv[2];
    const citiesToProcess = cityNameArg 
      ? CITIES_TO_PROCESS.filter(c => c.toLowerCase() === cityNameArg.toLowerCase())
      : CITIES_TO_PROCESS;

    if (cityNameArg && citiesToProcess.length === 0) {
      console.error(`❌ City "${cityNameArg}" not found in supported cities list.`);
      process.exit(1);
    }

    let cityIndex = 0;
    while (cityIndex < citiesToProcess.length) {
      const city = citiesToProcess[cityIndex];
      
      // 🕵️ Status Detection: Skip cities that are already fully scrapped
      const status = await ListingService.getScrapingStatus(city, 'list');
      if (status === 'completed') {
        console.log(`\n⏭️ [SKIPPING] City: ${city.toUpperCase()} is already marked as COMPLETED.`);
        cityIndex++;
        continue;
      }

      console.log(`\n🏁 [STARTING] Processing City: ${city.toUpperCase()} (Current Status: ${status})`);
      await ListingService.setScrapingStatus(city, 'list', 'in_progress');

      try {
        const isCityDone = await processCity(city, extractor);
        
        if (isCityDone) {
          // 🏁 Mark City as Fully Completed
          await ListingService.setScrapingStatus(city, 'list', 'completed');
          console.log(`\n✅ [COMPLETED] City: ${city.toUpperCase()} is now marked as COMPLETED.`);
        } else {
          console.log(`\n⚠️  [PARTIAL] City: ${city.toUpperCase()} has some failures. Remaining in progress.`);
        }
        
        // Move to next city regardless of partial failures (it will resume next run)
        cityIndex++;
        
        // Extra cooldown between cities
        console.log(`\n☕ Multi-City Cooldown... (10s)`);
        await new Promise(r => setTimeout(r, 10000));
      } catch (error: any) {
         if (error.message && error.message.includes('BAN_DETECTED')) {
            console.log(`\n\n🚨🚨 SEVERE WAF BAN DETECTED during ${city} list scraping! 🚨🚨`);
            console.log(`⏳ Entering 15-minute stealth cooldown...`);
            await new Promise(r => setTimeout(r, 15 * 60 * 1000)); 
            console.log(`\n🔄 Cooldown complete. Auto-Resuming city: ${city}...\n`);
            // We do NOT increment cityIndex, so it retries the same city
         } else {
            console.error("🚨 Critical Pipeline Failure:", error);
            break;
         }
      }
    }

    console.log("\n🥇 ALL CITIES COMPLETED SUCCESSFULLY.");
  } catch (error) {
    console.error("🚨 Critical System Error:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

main();
