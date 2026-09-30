const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { run } = require('./src/browser');

async function test() {
  try {
    console.log('Testing Browser Intelligence...');
    const result = await run('Cafe', 'Coimbatore');
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
