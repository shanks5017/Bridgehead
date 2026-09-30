'use strict';
/**
 * ZONEK GOV DATA ENGINE — Main Entry Point (Cron Scheduler)
 *
 * Cron Schedule:
 *   Every 6h   → weather, infrastructure (live feeds)
 *   Daily 3AM  → cropPrices (Agmarknet daily)
 *   Weekly Mon → schemes (HuggingFace), jjm, courts
 *   Monthly 1st → pmay
 *   Annual     → population, crime, schools, budget, elections (manual trigger)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const cron = require('node-cron');
const { connectDB, disconnectDB } = require('./config/db');
const { runAll, runFetcher, FETCHERS } = require('./orchestrator');
const logger = require('./utils/logger');

async function bootstrap() {
  logger.info('🌐 Zonek Gov Data Engine starting...');
  await connectDB();

  // ── CRON JOBS ────────────────────────────────────────────────────────────

  // Every 6 hours — live weather data
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[Cron] 6h tick → weather');
    await runFetcher(FETCHERS.find((f) => f.id === 'weather'));
  });

  // Every 6 hours — RSS infrastructure news
  cron.schedule('30 */6 * * *', async () => {
    logger.info('[Cron] 6h tick → infrastructure news');
    await runFetcher(FETCHERS.find((f) => f.id === 'infrastructure'));
  });

  // Daily at 03:00 IST — crop prices from Agmarknet
  cron.schedule('0 3 * * *', async () => {
    logger.info('[Cron] Daily 03:00 → crop prices');
    await runFetcher(FETCHERS.find((f) => f.id === 'cropPrices'));
  });

  // Every Monday 04:00 — schemes (HuggingFace weekly dataset)
  cron.schedule('0 4 * * 1', async () => {
    logger.info('[Cron] Weekly Monday → schemes');
    await runFetcher(FETCHERS.find((f) => f.id === 'schemes'));
  });

  // Every Monday 05:00 — JJM water coverage
  cron.schedule('0 5 * * 1', async () => {
    logger.info('[Cron] Weekly Monday → JJM');
    await runFetcher(FETCHERS.find((f) => f.id === 'jjm'));
  });

  // Every Wednesday 05:00 — courts (NJDG weekly)
  cron.schedule('0 5 * * 3', async () => {
    logger.info('[Cron] Weekly Wednesday → courts');
    await runFetcher(FETCHERS.find((f) => f.id === 'courts'));
  });

  // 1st of every month 02:00 — PMAY housing
  cron.schedule('0 2 1 * *', async () => {
    logger.info('[Cron] Monthly 1st → PMAY');
    await runFetcher(FETCHERS.find((f) => f.id === 'pmay'));
  });

  // ── IMMEDIATE STARTUP RUN ────────────────────────────────────────────────
  // On first start, run all live/periodic fetchers immediately
  logger.info('⚡ Running initial live fetch cycle on startup...');
  await runAll(['weather', 'infrastructure', 'cropPrices']);

  logger.info('✅ All cron jobs scheduled. Engine is running.');
  logger.info('   → Ctrl+C to stop\n');
  logger.info('   Cron Schedule:');
  logger.info('     Every 6h   : weather, infrastructure');
  logger.info('     Daily 03:00: cropPrices');
  logger.info('     Mon 04:00  : schemes');
  logger.info('     Mon 05:00  : jjm');
  logger.info('     Wed 05:00  : courts');
  logger.info('     1st 02:00  : pmay');
  logger.info('\n   Manual runs:');
  logger.info('     node src/orchestrator.js population crime schools budget elections\n');
}

// Graceful shutdown
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

async function shutdown() {
  logger.info('\n🛑 Shutdown signal received — disconnecting...');
  await disconnectDB();
  process.exit(0);
}

bootstrap().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
