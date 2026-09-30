import mongoose from 'mongoose';
import { ScrapingStatus } from '../zonek-core/src/database/schema.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function verify() {
  await mongoose.connect(MONGODB_URI);
  const statuses = await ScrapingStatus.find({ type: 'list' });
  console.log("Current List Statuses:");
  statuses.forEach(s => console.log(`- ${s.cityName}: ${s.status}`));
  await mongoose.disconnect();
}

verify().catch(console.error);
