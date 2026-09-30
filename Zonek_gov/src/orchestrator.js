'use strict';
/**
 * ORCHESTRATOR — Run all fetchers in correct order with dependency awareness
 *
 * Execution Order:
 *  Static/Annual (run once, rarely change):
 *    1. population  — Census 2011 CSV
 *    2. crime       — NCRB annual CSV
 *    3. schools     — UDISE+ annual CSV
 *    4. budget      — RBI seed data (annual)
 *    5. elections   — GitHub ECI data (post-election)
 *    6. schemes     — HuggingFace weekly
 *
 *  Live / Periodic (run on schedule):
 *    7. weather     — Open-Meteo (every 6h)
 *    8. cropPrices  — data.gov.in API (daily)
 *    9. infrastructure — Google RSS (every 6h)
 *   10. jjm         — ejalshakti POST (weekly)
 *   11. pmay        — rhreporting POST (monthly)
 *   12. courts      — NJDG GET (weekly)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

// Fetcher registry
const FETCHERS = [
  // Static — order matters for FK relationships
  { id: 'population',     module: './fetchers/population',     type: 'static',  label: 'Census Population' },
  { id: 'crime',          module: './fetchers/crime',          type: 'static',  label: 'NCRB Crime Data' },
  { id: 'schools',        module: './fetchers/schools',        type: 'static',  label: 'UDISE+ Schools' },
  { id: 'budget',         module: './fetchers/budget',         type: 'static',  label: 'State Budgets' },
  { id: 'elections',      module: './fetchers/elections',      type: 'static',  label: 'ECI Elections' },
  { id: 'schemes',        module: './fetchers/schemes',        type: 'periodic', label: 'Gov Schemes (HuggingFace)' },
  // Live
  { id: 'weather',        module: './fetchers/weather',        type: 'live',    label: 'Weather (Open-Meteo)' },
  { id: 'cropPrices',     module: './fetchers/cropPrices',     type: 'live',    label: 'Crop Prices (Agmarknet)' },
  { id: 'infrastructure', module: './fetchers/infrastructure', type: 'live',    label: 'Infrastructure News (RSS)' },
  { id: 'jjm',            module: './fetchers/jjm',            type: 'periodic', label: 'Jal Jeevan Mission' },
  { id: 'pmay',           module: './fetchers/pmay',           type: 'periodic', label: 'PMAY Housing' },
  { id: 'courts',         module: './fetchers/courts',         type: 'periodic', label: 'NJDG Courts' },
];

/**
 * Run a single fetcher by ID with full error isolation.
 * One fetcher failing does NOT stop the rest.
 */
async function runFetcher(fetcherConfig) {
  const { id, module: modulePath, label } = fetcherConfig;
  const start = Date.now();
  logger.info(`\n${'─'.repeat(60)}\n▶  [ORCHESTRATOR] Starting: ${label} (${id})\n${'─'.repeat(60)}`);

  try {
    const fetcher = require(modulePath);
    await fetcher.run();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info(`✅ [ORCHESTRATOR] Completed: ${label} in ${elapsed}s`);
    return { id, status: 'success', elapsed };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.error(`❌ [ORCHESTRATOR] FAILED: ${label} — ${err.message} (after ${elapsed}s)`);
    return { id, status: 'failed', error: err.message, elapsed };
  }
}

/**
 * Run all fetchers. Pass a filter array to run only specific IDs.
 * Example: runAll(['weather', 'cropPrices'])
 */
async function runAll(filterIds = null) {
  const start = Date.now();
  const toRun = filterIds
    ? FETCHERS.filter((f) => filterIds.includes(f.id))
    : FETCHERS;

  logger.info(`\n${'═'.repeat(60)}\n🚀 ZONEK GOV DATA ENGINE — Starting ${toRun.length} fetchers\n${'═'.repeat(60)}`);

  const results = [];
  for (const fetcher of toRun) {
    const result = await runFetcher(fetcher);
    results.push(result);
  }

  // Summary report
  const succeeded = results.filter((r) => r.status === 'success').length;
  const failed    = results.filter((r) => r.status === 'failed');
  const totalSec  = ((Date.now() - start) / 1000).toFixed(1);

  logger.info(`\n${'═'.repeat(60)}`);
  logger.info(`📊 ORCHESTRATOR SUMMARY — ${toRun.length} total | ✅ ${succeeded} ok | ❌ ${failed.length} failed | ⏱ ${totalSec}s`);
  if (failed.length > 0) {
    failed.forEach((f) => logger.error(`   ↳ FAILED: ${f.id} — ${f.error}`));
  }
  logger.info(`${'═'.repeat(60)}\n`);

  return results;
}

module.exports = { runAll, runFetcher, FETCHERS };

// Direct run: node src/orchestrator.js [fetcherId1] [fetcherId2] ...
if (require.main === module) {
  const args = process.argv.slice(2);
  const filterIds = args.length > 0 ? args : null;

  (async () => {
    await connectDB();
    await runAll(filterIds);
    await disconnectDB();
  })();
}
