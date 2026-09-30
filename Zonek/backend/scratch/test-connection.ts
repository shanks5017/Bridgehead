import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function check() {
  console.log('Testing connection to:', url);
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  if (error) {
    console.error('Error fetching profiles:', error.message);
  } else {
    console.log('Profiles table exists! Data:', data);
  }
}

check();
