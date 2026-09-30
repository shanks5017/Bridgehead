const { supabase } = require('./src/config/db');

const tables = [
  'gov_weather',
  'gov_crop_prices',
  'gov_infrastructure_news',
  'gov_schemes',
  'gov_jjm',
  'gov_pmay',
  'gov_courts',
  'gov_budgets',
  'gov_population',
  'gov_crimes',
  'gov_schools',
  'gov_elections'
];

async function checkAll() {
  console.log('--- CHECKING TABLE STATUS ---');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Exception - ${e.message}`);
    }
  }
}

checkAll();
