import mongoose from 'mongoose';
import { ScrapingStatus } from './database/schema.js';
import dotenv from 'dotenv';

const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath.pathname.substring(process.platform === 'win32' ? 1 : 0) });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function markUncompleted() {
  await mongoose.connect(MONGODB_URI);
  const cityName = 'Tirupur';
  
  // Mark all category-level statuses as pending
  const resultCats = await ScrapingStatus.updateMany(
    { cityName, type: 'list' },
    { $set: { status: 'pending' } }
  );
  
  console.log(`✅ Marked ${resultCats.modifiedCount} records as uncompleted (pending) for ${cityName}.`);
  
  await mongoose.disconnect();
}

markUncompleted().catch(console.error);
