'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Prevent MaxListenersExceededWarning when running 12 concurrent HTTPS connections
require('events').EventEmitter.defaultMaxListeners = 30;
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Supabase credentials missing in .env');
  // Don't throw immediately so the process can boot, but operations will fail.
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
  auth: {
    persistSession: false
  }
});

async function connectDB() {
  if (supabaseUrl && supabaseKey) {
    logger.info(`✅ Supabase client initialized`);
  } else {
    logger.warn(`⚠️ Supabase client initialized with placeholder credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  }
}

async function disconnectDB() {
  logger.info('Supabase client disconnected (no-op)');
}

module.exports = { connectDB, disconnectDB, supabase };
