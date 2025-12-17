// Script to completely remove the authProvider/authProviderId fields and index
const mongoose = require('mongoose');
require('dotenv').config();

async function completelyFixIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bridgehead');
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // List all indexes
        const indexes = await usersCollection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(idx => console.log('  -', idx.name, JSON.stringify(idx.key)));

        // Drop ALL indexes except _id
        for (const index of indexes) {
            if (index.name !== '_id_') {
                try {
                    await usersCollection.dropIndex(index.name);
                    console.log(`✅ Dropped index: ${index.name}`);
                } catch (error) {
                    console.log(`⚠️  Could not drop ${index.name}:`, error.message);
                }
            }
        }

        // Recreate only the essential indexes
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log('✅ Created unique email index');

        // DO NOT create authProvider index - we don't need it for email-only auth

        console.log('\n✅ Index cleanup complete!');
        console.log('📋 Final indexes:');
        const finalIndexes = await usersCollection.indexes();
        finalIndexes.forEach(idx => console.log('  -', idx.name, JSON.stringify(idx.key)));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

completelyFixIndex();
