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

    console.log(`📊 Total Posts for admin ${admin.username}:`);
    console.log(`- Rentals: ${rentalCount}`);
    console.log(`- Demands: ${demandCount}`);

    // Check for a real-world record
    const realRental = await RentalPost.findOne({ 
        createdBy: admin._id,
        title: { $regex: /Industrial Space/i }
    });
    
    if (realRental) {
        console.log('\n✅ Found Real Rental Record:');
        console.log(`- Title: ${realRental.title}`);
        console.log(`- Category: ${realRental.category}`);
        console.log(`- Price/SqFt: ${realRental.pricePerSqFtYearly}`);
        console.log(`- Amenities: ${realRental.amenities?.join(', ')}`);
        console.log(`- Zoning: ${realRental.zoningCode}`);
    } else {
        console.log('\n❌ Real Rental Record NOT FOUND!');
    }

    const realDemand = await DemandPost.findOne({ 
        createdBy: admin._id,
        title: { $regex: /Community Request/i }
    });

    if (realDemand) {
        console.log('\n✅ Found Real Demand Record:');
        console.log(`- Title: ${realDemand.title}`);
        console.log(`- Urgency: ${realDemand.urgencyScore}`);
        console.log(`- Demographics: ${realDemand.demographics?.join(', ')}`);
        console.log(`- Distance Radius: ${realDemand.distanceRadiusMiles}`);
    } else {
        console.log('\n❌ Real Demand Record NOT FOUND!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

verify();
