import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ListingService } from './database/listingService.js';
import { DetailEnricher } from './engine/enricher.js';
import fs from 'fs';
import path from 'path';

// Robust environment loading
const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

/**
 * City-Agnostic Enrichment Pipeline
 * Run with: npx tsx zonek-core/src/enricher_main.ts <CityName>
 */
async function startCityAdsEnrichment(cityName: string) {
  // Normalize city name
  cityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();

  // 1. Load Categories from Config
  const configPath = new URL(`./${cityName.toLowerCase()}.json`, import.meta.url);
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Configuration file not found for city: ${cityName} at ${configPath.pathname}`);
    return false; // Skip city if config is missing
  }

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Get unique categories from config
  const categories = Object.keys(
    configData.atomicUnits.reduce((acc: any, unit: any) => {
      unit.categories.forEach((cat: string) => acc[cat] = true);
      return acc;
    }, {})
  );

  // 2. Initialize Worker Pool
  const MAX_CONCURRENT_TABS = 5; 
  const enricher = new DetailEnricher(MAX_CONCURRENT_TABS);
  await enricher.init();

  console.log(`🚀 Starting ${cityName} Ads Enrichment for ${categories.length} categories.`);
  
  for (const category of categories) {
    console.log(`\n📂 Fetching Unenriched Data for Category: [${category}] in ${cityName}`);
    
    // Fetch records needing enrichment
    const pendingListings = await ListingService.getUnenrichedListingsByCategory(cityName, 'justdial', category, 10000);
    
    // Check if category is already marked as completed
    const catStatus = await ListingService.getScrapingStatus(cityName, 'ads', category);
    
    if (pendingListings.length === 0) {
      if (catStatus !== 'completed') {
        await ListingService.setScrapingStatus(cityName, 'ads', 'completed', category);
      }
      console.log(`✅ Category [${category}] is fully enriched! Moving to next.`);
      continue;
    }

    console.log(`⏱️ Found ${pendingListings.length} listings in [${category}] to enrich (Status: ${catStatus}). Starting Headless Pool...`);
    await ListingService.setScrapingStatus(cityName, 'ads', 'in_progress', category);
    
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
        // Use the generalized service method
        await ListingService.saveToEnrichedAds(cityName, sourceListing, data);
      }
    });

    console.log(`✅ Category [${category}] Enrichment Complete.`);
    await ListingService.setScrapingStatus(cityName, 'ads', 'completed', category);
    
    // 🌬️ Deep Breath Pause
    console.log(`🌬️ Pausing for JD server chillout (5s)...`);
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`🎉 All Categories for ${cityName} Enriched! Closing Worker Pool.`);
  await enricher.close();
  return true;
}

// 🩺 Self-Healing Global Operations Wrapper
const CITIES_TO_ENRICH = [
  'Bangalore',
  'Chennai',
  'Madurai',
  'Trichy',
  'Salem',
  'Kochi',
  'Tirupur',
  'Vellore',
  'Coimbatore',
  'Hyderabad'
];

async function runWithAutoHeal() {
  const cityNameArg = process.argv[2];
  const citiesToProcess = cityNameArg ? [cityNameArg] : CITIES_TO_ENRICH;

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Database connected successfully.");

  let cityIndex = 0;
  while(cityIndex < citiesToProcess.length) {
     const cityName = citiesToProcess[cityIndex];
     try {
        console.log(`\n🌆 ==========================================`);
        console.log(`🌆 ENRICHING CITY: ${cityName.toUpperCase()}`);
        console.log(`🌆 ==========================================`);
        
        await startCityAdsEnrichment(cityName);
        cityIndex++;
        
        console.log(`\n☕ Multi-City Enrichment Cooldown... (10s)`);
        await new Promise(r => setTimeout(r, 10000));
     } catch (e: any) {
        if (e.message && e.message.includes('BAN_DETECTED')) {
           console.log(`\n\n🚨🚨 SEVERE WAF BAN DETECTED during ${cityName} enrichment! 🚨🚨`);
           console.log(`⏳ Entering 15-minute stealth cooldown...`);
           await new Promise(r => setTimeout(r, 15 * 60 * 1000)); 
           console.log(`\n🔄 Cooldown complete. Auto-Resuming city: ${cityName}...\n`);
           // Retry same city
        } else {
           console.error("❌ Fatal Terminal Error:", e);
           break;
        }
     }
  }
  await mongoose.disconnect();
}

runWithAutoHeal().catch(console.error);
