const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['gov_weather', 'gov_crop_prices', 'gov_infrastructure_news', 'gov_schemes'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`Table: ${t}`);
      console.log(`Keys: ${Object.keys(data[0]).join(', ')}`);
    } else {
        console.log(`Table: ${t} - Error/NoData:`, error? error.message : 'Empty');
    }
  }
}
check();
