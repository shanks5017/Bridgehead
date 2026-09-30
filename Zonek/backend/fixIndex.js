// Script to fix the duplicate key index issue
// Run this with: node fixIndex.js

const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bridgehead');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Drop the problematic index
        try {
            await usersCollection.dropIndex('authProvider_1_authProviderId_1');
            console.log('✅ Dropped old authProvider_1_authProviderId_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index does not exist, skipping drop');
            } else {
                throw error;
            }
        }

        // Create the correct sparse index
        await usersCollection.createIndex(
            { authProvider: 1, authProviderId: 1 },
            { unique: true, sparse: true }
        );
        console.log('✅ Created new sparse index on authProvider and authProviderId');

        console.log('\n✅ Index fix complete! You can now signup with email.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixIndex();
