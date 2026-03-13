import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function cleanupDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`📦 Found ${collections.length} collections.`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Preserve 'users' collection
      if (collectionName === 'users') {
        const userCount = await db.collection(collectionName).countDocuments();
        console.log(`ℹ️ Skipping 'users' collection (preserved ${userCount} accounts).`);
        continue;
      }

      // Check for GridFS collections
      if (collectionName === 'fs.files' || collectionName === 'fs.chunks') {
        console.log(`🗑️ Dropping GridFS collection: ${collectionName}...`);
        await db.collection(collectionName).drop();
        console.log(`✅ Dropped ${collectionName}.`);
        continue;
      }

      // Delete all documents in other collections
      console.log(`🗑️ Clearing collection: ${collectionName}...`);
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`✅ Cleared ${collectionName}: Deleted ${result.deletedCount} documents.`);
    }

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('📝 All data removed except user accounts.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();
