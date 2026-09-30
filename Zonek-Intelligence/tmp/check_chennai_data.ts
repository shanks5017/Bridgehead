import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getListingModel, ScrapingStatus } from '../zonek-core/src/database/schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkChennai() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const cityName = 'Chennai';
  const Listing = getListingModel(cityName);
  
  const total = await Listing.countDocuments({});
  console.log(`Total listings in Chennai_List: ${total}`);

  const distinctCats = await Listing.distinct('category');
  console.log(`Distinct categories in Chennai_List: ${distinctCats.length}`);
  console.log(JSON.stringify(distinctCats, null, 2));

  const statuses = await ScrapingStatus.find({ cityName, type: 'ads' });
  console.log(`\nAd Scraping Statuses:`);
  statuses.forEach(s => {
    console.log(` - ${s.category}: ${s.status}`);
  });

  await mongoose.disconnect();
}

checkChennai();
