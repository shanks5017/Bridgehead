import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 30;

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Supabase credentials missing in .env');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder', 
  {
    auth: {
      persistSession: false
    }
  }
);

export async function connectDB(): Promise<void> {
  if (supabaseUrl && supabaseKey) {
    logger.info(`✅ Supabase client initialized`);
  } else {
    logger.warn(`⚠️ Supabase client initialized with placeholder credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  }
}

export async function disconnectDB(): Promise<void> {
  logger.info('Supabase client disconnected (no-op)');
}
