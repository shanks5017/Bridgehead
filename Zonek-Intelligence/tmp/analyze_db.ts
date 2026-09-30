import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zonek';

async function analyzeDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection failed');
    const collections = await db.listCollections().toArray();
    console.log('--- Collections in Database ---');
    collections.forEach(col => console.log(col.name));
    console.log('--- End of Collections ---');
  } catch (err) {
    console.error('Error analyzing DB:', err);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeDB();
