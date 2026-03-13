import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import RentalPost from '../models/RentalPost';
import DemandPost from '../models/DemandPost';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const BATCH_SIZE = 100;

async function uploadData() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Ensure Admin User exists
    const adminEmail = 'shashank5017sh@gmail.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
        console.log('👤 Creating Admin User...');
        admin = new User({
            fullName: 'Shashank Admin',
            email: adminEmail,
            username: 'shashank_5017',
            password: 'shashank@5017U', // Will be hashed by pre-save middleware
            userType: 'entrepreneur',
            verified: true
        });
        await admin.save();
        console.log('✅ Admin User created.');
    } else {
        console.log('✅ Admin User already exists.');
    }

    const adminId = admin._id;

    // 2. Upload Rentals
    const rentalsPath = path.join(__dirname, '../datasets/rentals_FINAL (3).json');
    if (fs.existsSync(rentalsPath)) {
        const rentalsData = JSON.parse(fs.readFileSync(rentalsPath, 'utf8'));
        console.log(`📦 Found ${rentalsData.length} rentals. Starting upload...`);

        for (let i = 0; i < rentalsData.length; i += BATCH_SIZE) {
            const batch = rentalsData.slice(i, i + BATCH_SIZE);
            const formattedBatch = batch.map((item: any) => ({
                title: item.title,
                category: item.category,
                description: item.description,
                price: item.price,
                pricePerSqFtYearly: item.pricePerSqFtYearly,
                squareFeet: item.squareFeet,
                leaseType: item.leaseType,
                amenities: item.amenities,
                zoningCode: item.zoningCode,
                images: item.images,
                phone: item.phone,
                email: item.email,
                openToCollaboration: item.collaborationOpen ?? true,
                location: {
                    type: 'Point',
                    coordinates: [item.location.lng, item.location.lat],
                    address: item.location.address || `${item.location.city || ''}, ${item.location.state || ''}`
                },
                createdBy: adminId,
                status: 'available',
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            }));

            await RentalPost.insertMany(formattedBatch, { ordered: false });
            console.log(`✅ Uploaded rentals ${i + 1} to ${Math.min(i + BATCH_SIZE, rentalsData.length)}`);
        }
    }

    // 3. Upload Demands
    const demandsPath = path.join(__dirname, '../datasets/demands_FINAL (3).json');
    if (fs.existsSync(demandsPath)) {
        const demandsData = JSON.parse(fs.readFileSync(demandsPath, 'utf8'));
        console.log(`📦 Found ${demandsData.length} demands. Starting upload...`);

        for (let i = 0; i < demandsData.length; i += BATCH_SIZE) {
            const batch = demandsData.slice(i, i + BATCH_SIZE);
            const formattedBatch = batch.map((item: any) => ({
                title: item.title,
                category: item.category,
                description: item.description,
                demographics: item.demographics,
                urgencyScore: item.urgencyScore,
                distanceRadiusMiles: item.distanceRadiusMiles,
                images: item.images,
                phone: item.phone,
                email: item.email,
                openToCollaboration: item.collaborationOpen ?? true,
                upvotes: item.upvotes || 0,
                location: {
                    type: 'Point',
                    coordinates: [item.location.lng, item.location.lat],
                    address: item.location.address || `${item.location.city || ''}, ${item.location.state || ''}`
                },
                createdBy: adminId,
                status: 'active',
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            }));

            await DemandPost.insertMany(formattedBatch, { ordered: false });
            console.log(`✅ Uploaded demands ${i + 1} to ${Math.min(i + BATCH_SIZE, demandsData.length)}`);
        }
    }

    console.log('✨ Data upload completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadData();
