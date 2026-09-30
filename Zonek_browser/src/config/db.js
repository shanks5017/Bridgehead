'use strict';
require('events').EventEmitter.defaultMaxListeners = 30;
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const logger = require('../utils/logger');

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

module.exports = { connectDB, disconnectDB };
