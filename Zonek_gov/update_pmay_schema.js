const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ID from the URL: https://[project-id].supabase.co
const url = new URL(SUPABASE_URL);
const projectId = url.hostname.split('.')[0];

const connectionString = `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres`;

console.log(`Connecting to: db.${projectId}.supabase.co`);

const pool = new Pool({
  connectionString: connectionString,
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database');

    // Check if the as_of_date column exists
    const checkColumn = {
      text: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'gov_pmay' AND column_name = 'as_of_date'
      `,
    };
    const res = await client.query(checkColumn);
    if (res.rowCount > 0) {
      console.log('Column as_of_date already exists. Skipping addition.');
    } else {
      console.log('Column as_of_date does not exist. Adding it and other columns...');
      // Add the columns
      await client.query(`
        ALTER TABLE gov_pmay
          ADD COLUMN IF NOT EXISTS as_of_date DATE,
          ADD COLUMN IF NOT EXISTS houses_under_construction INTEGER,
          ADD COLUMN IF NOT EXISTS completion_pct NUMERIC,
          ADD COLUMN IF NOT EXISTS construction_activity_index INTEGER;
      `);
      console.log('Columns added.');

      // Update the unique constraint
      await client.query(`
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE table_name = 'gov_pmay' AND constraint_name = 'gov_pmay_district_id_sanction_year_fetched_at_key') THEN
                EXECUTE 'ALTER TABLE gov_pmay DROP CONSTRAINT gov_pmay_district_id_sanction_year_fetched_at_key';
            END IF;
        END $$;
      `);

      await client.query(`
        ALTER TABLE gov_pmay
          ADD CONSTRAINT gov_pmay_district_id_as_of_date_unique UNIQUE (district_id, as_of_date);
      `);
      console.log('Unique constraint updated.');
    }

    // Also, let's check if the table has the other columns we expect (just in case)
    const checkAllColumns = {
      text: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'gov_pmay'
      `,
    };
    const allRes = await client.query(checkAllColumns);
    console.log('Current columns in gov_pmay:', allRes.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error running migration:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration().then(() => console.log('Migration completed')).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});