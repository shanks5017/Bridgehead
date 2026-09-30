import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function getDocumentCounts() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('\n📊 Collection Counts:');
    console.log('---------------------');

    let totalDocuments = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName.padEnd(20)}: ${count} documents`);
      totalDocuments += count;
    }

    console.log('---------------------');
    console.log(`${'Total'.padEnd(20)}: ${totalDocuments} documents`);

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching counts:', error);
    process.exit(1);
  }
}

getDocumentCounts();
