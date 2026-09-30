const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: gov_states } = await supabase.from('gov_states').select('*').limit(1);
  console.log('gov_states:', gov_states ? (gov_states.length > 0 ? Object.keys(gov_states[0]) : 'Empty table') : 'Missing table');

  const { data: gov_districts } = await supabase.from('gov_districts').select('*').limit(1);
  console.log('gov_districts:', gov_districts ? (gov_districts.length > 0 ? Object.keys(gov_districts[0]) : 'Empty table') : 'Missing table');
  
  // also check if there is an rpc or a lookup in pipeline.js
}
check();
