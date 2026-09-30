const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${new URL(process.env.SUPABASE_URL).hostname.split('.')[0]}.supabase.co:5432/postgres`
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'gov_crop_prices'")
  .then(res => {
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  });