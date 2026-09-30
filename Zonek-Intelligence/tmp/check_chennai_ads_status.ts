import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getListingModel, getAdsModel } from '../zonek-core/src/database/schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkChennai() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const cityName = 'Chennai';
  const ListingModel = getListingModel(cityName);
  const AdsModel = getAdsModel(cityName);

  const totalListings = await ListingModel.countDocuments({ status: 'active' });
  const totalAds = await AdsModel.countDocuments({});

  console.log(`\nChennai Status:`);
  console.log(` - Total Active Listings: ${totalListings}`);
  console.log(` - Total Enriched Ads: ${totalAds}`);
  
  const pending = totalListings - totalAds;
  console.log(` - Pending Enrichment: ${pending}`);

  await mongoose.disconnect();
}

checkChennai();
