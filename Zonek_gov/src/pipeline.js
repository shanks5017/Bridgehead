'use strict';
/**
 * ZONEK GOV — SMART PIPELINE
 * ══════════════════════════════════════════════════════════════════
 * Run this ONCE: node src/pipeline.js
 *
 * What it does:
 *   1. Checks freshness of each data module against MongoDB
 *   2. Only re-fetches modules that are stale (past their update window)
 *   3. Zero duplicates — all upserts use compound unique indexes
 *   4. Self-scheduling via node-cron for continuous operation
 *
 * Usage:
 *   node src/pipeline.js           → Smart run (skips fresh data)
 *   node src/pipeline.js --force   → Force re-fetch everything
 *   node src/pipeline.js --module cropPrices  → Run single module
 *   node src/pipeline.js --daemon  → Run once + start cron scheduler
 * ══════════════════════════════════════════════════════════════════
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('events').EventEmitter.defaultMaxListeners = 50;

const cron = require('node-cron');
const { connectDB, disconnectDB, supabase } = require('./config/db');
const logger = require('./utils/logger');

// ── MODULE REGISTRY ────────────────────────────────────────────────────────
// Each module defines:
//   staleAfterHours : re-fetch if last record is older than N hours
//   collection      : MongoDB collection name to check freshness
//   cronSchedule    : cron expression for daemon mode
//   type            : 'live' | 'periodic' | 'static'
const MODULES = [
  {
    id: 'weather',
    label: 'Weather (12 cities)',
    fetcher: './fetchers/weather',
    collection: 'gov_weather',
    staleAfterHours: 6,        // Fetch every 6 hours
    cronSchedule: '0 */6 * * *',
    type: 'live',
  },
  {
    id: 'cropPrices',
    label: 'Crop Prices (Agmarknet)',
    fetcher: './fetchers/cropPrices',
    collection: 'gov_crop_prices',
    staleAfterHours: 24,       // Fetch daily
    cronSchedule: '0 3 * * *',
    type: 'live',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure News (RSS)',
    fetcher: './fetchers/infrastructure',
    collection: 'gov_infrastructure_news',
    staleAfterHours: 6,        // Fetch every 6 hours
    cronSchedule: '30 */6 * * *',
    type: 'live',
  },
  {
    id: 'schemes',
    label: 'Government Schemes (myScheme)',
    fetcher: './fetchers/schemes',
    collection: 'gov_schemes',
    staleAfterHours: 168,      // Weekly (7 days)
    cronSchedule: '0 4 * * 1',
    type: 'periodic',
  },
  {
    id: 'jjm',
    label: 'Jal Jeevan Mission (Water)',
    fetcher: './fetchers/jjm',
    collection: 'gov_jjm',
    staleAfterHours: 168,      // Weekly
    cronSchedule: '0 5 * * 1',
    type: 'periodic',
  },
  {
    id: 'pmay',
    label: 'PMAY Housing',
    fetcher: './fetchers/pmay',
    collection: 'gov_pmay',
    staleAfterHours: 720,      // Monthly (30 days)
    cronSchedule: '0 2 1 * *',
    type: 'periodic',
  },
  {
    id: 'courts',
    label: 'NJDG Courts',
    fetcher: './fetchers/courts',
    collection: 'gov_courts',
    staleAfterHours: 168,      // Weekly
    cronSchedule: '0 5 * * 3',
    type: 'periodic',
  },
  {
    id: 'budget',
    label: 'State Budgets (RBI)',
    fetcher: './fetchers/budget',
    collection: 'gov_budgets',
    staleAfterHours: 8760,     // Annual (365 days)
    cronSchedule: '0 6 1 2 *', // Feb 1st (post-Union Budget)
    type: 'static',
  },
  {
    id: 'population',
    label: 'Population (Census 2011)',
    fetcher: './fetchers/population',
    collection: 'gov_population',
    staleAfterHours: 2160,     // 90 days
    cronSchedule: '0 7 1 */3 *', // Quarterly
    type: 'static',
  },
  {
    id: 'crime',
    label: 'Crime / Safety (NCRB)',
    fetcher: './fetchers/crime',
    collection: 'gov_crimes',
    staleAfterHours: 8760,     // Annual
    cronSchedule: '0 6 1 10 *', // Oct 1st (NCRB annual release)
    type: 'static',
  },
  {
    id: 'schools',
    label: 'Schools (UDISE+)',
    fetcher: './fetchers/schools',
    collection: 'gov_schools',
    staleAfterHours: 8760,     // Annual
    cronSchedule: '0 6 1 8 *', // Aug 1st (UDISE annual release)
    type: 'static',
  },
  {
    id: 'elections',
    label: 'Elections (ECI)',
    fetcher: './fetchers/elections',
    collection: 'gov_elections',
    staleAfterHours: 2160,     // 90 days
    cronSchedule: '0 3 1 */3 *', // Quarterly
    type: 'static',
  },
];

// ── FRESHNESS CHECK ────────────────────────────────────────────────────────
/**
 * Checks the newest fetchedAt timestamp in the collection.
 * Returns true if the data is still fresh (within staleAfterHours).
 */
async function isFresh(collectionName, staleAfterHours) {
  try {
    const { data, error } = await supabase
      .from(collectionName)
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0 || !data[0].fetched_at) return false;

    const ageHours = (Date.now() - new Date(data[0].fetched_at).getTime()) / (1000 * 3600);
    return ageHours < staleAfterHours;
  } catch (err) {
    logger.error(`[Pipeline] Error checking freshness: ${err.message}`);
    return false; // Treat as stale on error
  }
}

// ── SINGLE MODULE RUN ──────────────────────────────────────────────────────
async function runModule(mod, force = false) {
  const start = Date.now();

  if (!force) {
    const fresh = await isFresh(mod.collection, mod.staleAfterHours);
    if (fresh) {
      logger.info(`[Pipeline] ⏭  SKIP ${mod.label} — data is fresh (< ${mod.staleAfterHours}h old)`);
      return { id: mod.id, status: 'skipped' };
    }
  }

  logger.info(`[Pipeline] ▶  Running: ${mod.label}`);
  try {
    const fetcher = require(mod.fetcher);
    await fetcher.run();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.info(`[Pipeline] ✅ Done: ${mod.label} (${elapsed}s)`);
    return { id: mod.id, status: 'success', elapsed };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logger.error(`[Pipeline] ❌ FAILED: ${mod.label} — ${err.message} (${elapsed}s)`);
    return { id: mod.id, status: 'failed', error: err.message };
  }
}

// ── FULL PIPELINE RUN ──────────────────────────────────────────────────────
async function runPipeline(options = {}) {
  const { force = false, moduleId = null } = options;

  const toRun = moduleId
    ? MODULES.filter((m) => m.id === moduleId)
    : MODULES;

  const totalStart = Date.now();
  logger.info(`\n${'═'.repeat(65)}`);
  logger.info(`🚀 ZONEK GOV PIPELINE — ${toRun.length} modules | force=${force}`);
  logger.info(`${'═'.repeat(65)}`);

  const results = [];
  for (const mod of toRun) {
    const result = await runModule(mod, force);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.status === 'success').length;
  const skipped   = results.filter((r) => r.status === 'skipped').length;
  const failed    = results.filter((r) => r.status === 'failed');
  const totalSec  = ((Date.now() - totalStart) / 1000).toFixed(1);

  logger.info(`\n${'═'.repeat(65)}`);
  logger.info(`📊 PIPELINE COMPLETE — ✅ ${succeeded} fetched | ⏭ ${skipped} fresh | ❌ ${failed.length} failed | ⏱ ${totalSec}s`);
  if (failed.length) failed.forEach((f) => logger.error(`   ↳ ${f.id}: ${f.error}`));
  logger.info(`${'═'.repeat(65)}\n`);

  return results;
}

// ── DAEMON MODE (node src/pipeline.js --daemon) ────────────────────────────
function startDaemon() {
  logger.info('[Pipeline] 🔄 Daemon mode — registering cron jobs...');

  for (const mod of MODULES) {
    if (!mod.cronSchedule) continue;
    cron.schedule(mod.cronSchedule, async () => {
      logger.info(`[Cron] ⏰ Triggered: ${mod.label}`);
      await runModule(mod, false); // Smart — will skip if still fresh
    });
    logger.info(`[Cron] Registered: ${mod.label} → "${mod.cronSchedule}"`);
  }

  logger.info('[Pipeline] ✅ All cron jobs active. Engine running 24/7.');
  logger.info('[Pipeline]    Press Ctrl+C to stop.\n');
}

// ── ENTRY POINT ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const force    = args.includes('--force');
  const daemon   = args.includes('--daemon');
  const moduleArg = args.find((a) => a.startsWith('--module='));
  const moduleId  = moduleArg ? moduleArg.split('=')[1] : null;

  await connectDB();

  // Run pipeline immediately
  await runPipeline({ force, moduleId });

  if (daemon) {
    // Stay alive with cron
    startDaemon();
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

// Graceful shutdown
process.on('SIGINT',  async () => { logger.info('\n🛑 Stopping...'); await disconnectDB(); process.exit(0); });
process.on('SIGTERM', async () => { await disconnectDB(); process.exit(0); });

main().catch((err) => { logger.error(`Fatal: ${err.message}`); process.exit(1); });
