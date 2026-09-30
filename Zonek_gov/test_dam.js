const { supabase } = require('./src/config/db');
async function test() {
  const { data, error } = await supabase.from('gov_dam_levels').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
