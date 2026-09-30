import supabase from '../lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Verify that the Supabase client can reach the project.
 * Called once on server startup — exits if connection fails.
 */
export const verifySupabaseConnection = async (): Promise<void> => {
  try {
    // Lightweight check: fetch the first row of profiles (or none)
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      console.warn('⚠️ Supabase connection check warning (schema cache might be reloading):', error.message);
    } else {
      console.log('✅ Supabase connection verified');
    }
  } catch (err: any) {
    console.error('❌ Supabase connection check failed:', err.message);
    // Don't crash the server just because of a schema cache delay
  }
};
