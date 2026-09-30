const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: states, error: sErr } = await supabase.from('states').select('*').limit(1);
  console.log('States table:', states ? Object.keys(states[0] || {}) : sErr.message);
  
  const { data: districts, error: dErr } = await supabase.from('districts').select('*').limit(1);
  console.log('Districts table:', districts ? Object.keys(districts[0] || {}) : dErr.message);
}
check();
