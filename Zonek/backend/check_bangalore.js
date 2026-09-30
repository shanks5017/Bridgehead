const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('gov_districts')
     .select('*')
     .ilike('name', '%bangalore%')
     .limit(5);
  console.log(data);
}
check();
