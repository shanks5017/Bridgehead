import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ScrapingStatus } from './database/schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkMadurai() {
  await mongoose.connect(MONGODB_URI);
  const records = await ScrapingStatus.find({ cityName: 'Madurai', type: 'list' });
  console.log(JSON.stringify(records, null, 2));
  await mongoose.disconnect();
}

checkMadurai();
