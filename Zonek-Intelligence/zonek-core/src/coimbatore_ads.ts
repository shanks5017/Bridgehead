import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ListingService } from './database/listingService.js';
import { DetailEnricher } from './engine/enricher.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

// Read Categories from Config
const configPath = path.resolve(process.cwd(), 'src/coimbatore.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function startCoimbatoreAdsEnrichment() {
  // Get categories from config
  const categories = Object.keys(
    configData.atomicUnits.reduce((acc: any, unit: any) => {
      unit.categories.forEach((cat: string) => acc[cat] = true);
      return acc;
    }, {})
  );

  // Initialize Worker Pool
  const MAX_CONCURRENT_TABS = 5; // 🚀 Restored to 5 tabs per explicit request
  const enricher = new DetailEnricher(MAX_CONCURRENT_TABS);
  await enricher.init();

  console.log(`🚀 Starting Coimbatore Ads Enrichment for ${categories.length} categories.`);
  
  for (const category of categories) {
    console.log(`\n📂 Fetching Unenriched Data for Category: [${category}]`);
    
    // Fetch records needing enrichment
    const pendingListings = await ListingService.getUnenrichedListingsByCategory('justdial', category, 10000); // High limit to grab all
    
    if (pendingListings.length === 0) {
      console.log(`✅ Category [${category}] is fully enriched! Moving to next.`);
      continue;
    }

    console.log(`⏱️ Found ${pendingListings.length} listings in [${category}] to enrich. Starting Headless Pool...`);
    
    const urlsToProcess = pendingListings.map(l => ({ id: l._id.toString(), url: l.url }));

    let completed = 0;
    const total = urlsToProcess.length;

    await enricher.processBatch(urlsToProcess, async (id, data) => {
      completed++;
      if (completed % 10 === 0 || completed === total) {
        console.log(`   [${completed}/${total}] Enriched: ${id.substring(0, 8)}... | ${data.images.length} imgs | ${data.rating}★`);
      }
      
      const sourceListing = pendingListings.find(l => l._id.toString() === id);
      if (sourceListing) {
        await ListingService.saveToCoimbatoreAds(sourceListing, data);
      }
    });

    console.log(`✅ Category [${category}] Enrichment Complete.`);
    
    // 🌬️ Deep Breath Pause between huge category batches
    console.log(`🌬️ Pausing for JD server chillout (5s)...`);
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("🎉 All Categories Enriched! Closing Worker Pool and Database.");
  await enricher.close();
  return true;
}

// 🩺 Self-Healing Global Operations Wrapper
async function runWithAutoHeal() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Database connected successfully.");

  while(true) {
     try {
        const isDone = await startCoimbatoreAdsEnrichment();
        if (isDone) break; // Exit loop naturally
     } catch (e: any) {
        if (e.message && e.message.includes('BAN_DETECTED')) {
           console.log(`\n\n🚨🚨 SEVERE WAF BAN DETECTED! Justdial has temporarily blocked your IP. 🚨🚨`);
           console.log(`⏳ Entering 15-minute stealth cooldown to allow firewall to automatically clear your connection...`);
           
           // Cool down for 15 minutes
           await new Promise(r => setTimeout(r, 15 * 60 * 1000)); 
           
           console.log(`\n🔄 Cooldown complete. Extracting $nin difference and Auto-Resuming background extraction...\n`);
        } else {
           console.error("❌ Fatal Terminal Error:", e);
           break;
        }
     }
  }
  await mongoose.disconnect();
}

runWithAutoHeal().catch(console.error);
