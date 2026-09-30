// Simple script to check MongoDB data for image paths
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });


dotenv.config({ path: './backend/.env' });

const checkImagePaths = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Dynamically import models after connection
        const { default: DemandPost } = await import('./backend/models/DemandPost.js');
        const { default: RentalPost } = await import('./backend/models/RentalPost.js');

        // Check demand posts
        const demands = await DemandPost.find().limit(5);
        console.log('\n========== DEMAND POSTS ==========');
        demands.forEach((demand: any, idx: number) => {
            console.log(`\nDemand ${idx + 1}: ${demand.title}`);
            console.log(`Images count: ${demand.images.length}`);
            console.log(`Image paths:`, demand.images);
        });

        // Check rental posts
        const rentals = await RentalPost.find().limit(5);
        console.log('\n\n========== RENTAL POSTS ==========');
        rentals.forEach((rental: any, idx: number) => {
            console.log(`\nRental ${idx + 1}: ${rental.title}`);
            console.log(`Images count: ${rental.images.length}`);
            console.log(`Image paths:`, rental.images);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkImagePaths();
