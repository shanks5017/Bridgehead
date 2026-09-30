import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { DetailEnricher } from './src/engine/enricher.ts';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

async function verify() {
  const enricher = new DetailEnricher(1);
  await enricher.init();
  
  const targetUrl = 'https://www.justdial.com/Coimbatore/Sai-Lakshmi-Event-Management-Pvt-Ltd-Near-To-Parsn-Ganpath-Apartments-Peranaidu-Layout-Ram-Nagar/0422PX422-X422-111222152906-R4I3_BZDET';
  
  console.log(`🔍 Verifying extraction for: ${targetUrl}`);
  
  await enricher.processBatch([{ id: 'test-id', url: targetUrl }], async (id, data) => {
    console.log('\n--- EXTRACTION RESULTS ---');
    console.log('Phone Numbers:', data.phone);
    console.log('Rating:', data.rating);
    console.log('Images Found:', data.images.length);
    console.log('Working Hours:', data.workingHours);
    console.log('Business Summary:', data.overview);
    console.log('Year of Establishment:', data.yearEstablished);
    
    if (data.phone && data.phone.length > 0) {
      console.log('✅ SUCCESS: Phone numbers extracted!');
    } else {
      console.log('❌ FAILURE: No phone numbers found.');
    }
  });

  await enricher.close();
}

verify().catch(console.error);
