import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import RentalPost from '../models/RentalPost';
import DemandPost from '../models/DemandPost';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function verify() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    const adminEmail = 'shashank5017sh@gmail.com';
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        console.error('❌ Admin user not found!');
        process.exit(1);
    }

    const rentalCount = await RentalPost.countDocuments({ createdBy: admin._id });
    const demandCount = await DemandPost.countDocuments({ createdBy: admin._id });

    console.log(`📊 Verification Results for admin ${admin.username}:`);
    console.log(`- Rental Posts: ${rentalCount}`);
    console.log(`- Demand Posts: ${demandCount}`);

    if (rentalCount > 0) {
        const sampleRental = await RentalPost.findOne({ createdBy: admin._id });
        console.log('\n🔍 Sample Rental:');
        console.log(`- Title: ${sampleRental?.title}`);
        console.log(`- Amenities: ${sampleRental?.amenities?.join(', ')}`);
        console.log(`- Location: ${sampleRental?.location?.address} (${sampleRental?.location?.coordinates})`);
    }

    if (demandCount > 0) {
        const sampleDemand = await DemandPost.findOne({ createdBy: admin._id });
        console.log('\n🔍 Sample Demand:');
        console.log(`- Title: ${sampleDemand?.title}`);
        console.log(`- Urgency: ${sampleDemand?.urgencyScore}`);
        console.log(`- Demographics: ${sampleDemand?.demographics?.join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

verify();
