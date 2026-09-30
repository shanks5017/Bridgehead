import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    
    // Test the connection with a ping
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB!');
    
    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(db => console.log(`- ${db.name}`));
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error code name:', error.codeName);
    
    if (error.errorResponse) {
      console.error('MongoDB Error Response:', error.errorResponse);
    }
    
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

testConnection().catch(console.error);
