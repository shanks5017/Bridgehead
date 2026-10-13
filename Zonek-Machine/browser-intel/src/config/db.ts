require('events').EventEmitter.defaultMaxListeners = 30;
import * as dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zonek_browser';

async function connectDB() {
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  logger.info(`[Browser DB] ✅ Connected → ${mongoose.connection.db.databaseName}`);
}

async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('[Browser DB] Disconnected');
}

export {  connectDB, disconnectDB  };
