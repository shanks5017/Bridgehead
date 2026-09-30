const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = ['gov_jjm', 'gov_pmay', 'gov_courts', 'gov_schools', 'gov_elections', 'gov_crimes', 'gov_budgets', 'gov_population'];
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`Table: ${t} -> ${Object.keys(data[0]).slice(2, 6).join(', ')}`);
    } else {
      console.log(`Table: ${t} -> Empty`);
    }
  }
}
check();
