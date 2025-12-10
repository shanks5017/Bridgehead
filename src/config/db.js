import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

let dbConnection;

async function connectToDatabase() {
  try {
    if (!dbConnection) {
      console.log('Attempting to connect to MongoDB...');
      await client.connect();
      // Test the connection with a ping
      await client.db('admin').command({ ping: 1 });
      dbConnection = client.db();
      console.log('✅ Successfully connected to MongoDB!');
      console.log(`Connected to database: ${dbConnection.databaseName}`);
    }
    return dbConnection;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:');
    console.error('- Error name:', error.name);
    console.error('- Error message:', error.message);
    console.error('- Error code:', error.code);
    console.error('- Error code name:', error.codeName);
    console.error('- Connection string:', uri.replace(/:([^:]+)@/, ':***@')); // Hide password in logs
    throw error;
  }
}

async function closeConnection() {
  try {
    if (client) {
      await client.close();
      dbConnection = null;
      console.log('MongoDB connection closed.');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

// Handle application termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

const getClient = () => client;

export { connectToDatabase, closeConnection, getClient };
