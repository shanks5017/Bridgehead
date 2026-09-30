#!/usr/bin/env node
/**
 * ROOT-LEVEL PIPELINE LAUNCHER
 * Run this from ANYWHERE — it always resolves to the correct Zonek_gov directory.
 *
 * Usage (from Zonek_Main or anywhere):
 *   node zonek_gov/run.js
 *   node zonek_gov/run.js --force
 *   node zonek_gov/run.js --daemon
 *   node zonek_gov/run.js --module=weather
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const ZONEK_GOV_DIR = path.resolve(__dirname, 'Zonek_gov');
const PIPELINE_SCRIPT = path.join(ZONEK_GOV_DIR, 'src', 'pipeline.js');

const args = process.argv.slice(2);
const argStr = args.map(a => `"${a}"`).join(' ');

console.log(`\n🚀 Zonek Gov Pipeline Launcher`);
console.log(`   Directory: ${ZONEK_GOV_DIR}`);
console.log(`   Args: ${argStr || '(none — smart run)'}\n`);

// Spawn in the correct directory
const child = spawn(
  'node',
  [PIPELINE_SCRIPT, ...args],
  {
    cwd: ZONEK_GOV_DIR,
    stdio: 'inherit',
    env: { ...process.env }
  }
);

child.on('exit', (code) => {
  process.exit(code);
});
