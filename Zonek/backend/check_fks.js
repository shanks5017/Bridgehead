const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('gov_weather')
    .select('*, gov_states(name), gov_districts(name)')
    .limit(1);
    
  console.log(error ? error.message : "Joined Data: " + JSON.stringify(data[0]));
}
check();
