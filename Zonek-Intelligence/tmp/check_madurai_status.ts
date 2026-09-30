import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ScrapingStatus } from '../zonek-core/src/database/schema.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function checkStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const city = 'Madurai';
    const cityStatus = await ScrapingStatus.find({ cityName: city });

    console.log(`Status for ${city}:`);
    cityStatus.forEach(s => {
      console.log(` - Type: ${s.type}, Category: ${s.category || 'OVERALL'}, Status: ${s.status}`);
    });

    const categoryStatus = await ScrapingStatus.find({ cityName: city, type: 'list', category: { $exists: true } });
    const completedCategories = categoryStatus.filter(s => s.status === 'completed').length;
    const totalCategories = categoryStatus.length;

    console.log(`\nCompleted Categories: ${completedCategories}/${totalCategories}`);

    if (totalCategories === 0) {
        console.log("No category-level status found for Madurai.");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatus();
