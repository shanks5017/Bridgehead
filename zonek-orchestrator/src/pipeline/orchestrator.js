'use strict';
/**
 * MAIN ORCHESTRATOR
 * Runs all 4 data pipeline stages in parallel and then synthesises a report.
 * Uses Promise.allSettled so one failure never blocks the others.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const logger = require('../utils/logger');
const { runBrowserIntelligence }  = require('./browserAdapter');
const { runRentalScraper }        = require('./rentalAdapter');
const { runGovDataQuery }         = require('./govAdapter');
const { runCompetitorScraper }    = require('./competitorScraper');
const { buildIntelligencePacket } = require('../normalizer/intelligencePacket');
const { generateReport }          = require('../report/reportGenerator');
const { runFirewall }             = require('../normalizer/firewall');

const PIPELINE_TIMEOUT = parseInt(process.env.PIPELINE_TIMEOUT_MS) || 15000;

/**
 * Main research pipeline.
 * @param {Object} input  — User's research request
 * @param {Function} emit — SSE emitter function
 * @returns {Object}      — { packet, report }
 */
async function runResearchPipeline(input, emit) {
  const { businessType, location, budget } = input;

  logger.info(`[Pipeline] Starting 4-stage parallel pipeline for: ${businessType} @ ${location}`);

  emit('stage_started', { stage: 'all', message: 'Launching all intelligence engines simultaneously...' });

  // ── Run all 4 stages in parallel ─────────────────────────────────────────
  const [browserResult, rentalResult, govResult, competitorResult] = await Promise.allSettled([
    runWithTimeout(runBrowserIntelligence(input, emit), PIPELINE_TIMEOUT, 'browser'),
    runWithTimeout(runRentalScraper(input, emit),       PIPELINE_TIMEOUT, 'rentals'),
    runWithTimeout(runGovDataQuery(input, emit),        PIPELINE_TIMEOUT, 'gov'),
    runWithTimeout(runCompetitorScraper(input, emit),   PIPELINE_TIMEOUT, 'competitors'),
  ]);

  emit('stage_update', { stage: 'normalizing', status: 'running', message: 'Building intelligence packet from all data sources...' });

  // ── Unwrap results (fulfilled or null for rejected) ───────────────────────
  const data = {
    browser:     browserResult.status    === 'fulfilled' ? browserResult.value    : null,
    rentals:     rentalResult.status     === 'fulfilled' ? rentalResult.value     : null,
    gov:         govResult.status        === 'fulfilled' ? govResult.value        : null,
    competitors: competitorResult.status === 'fulfilled' ? competitorResult.value : null,
  };

  // Log stage outcomes
  Object.entries(data).forEach(([key, val]) => {
    if (!val) logger.warn(`[Pipeline] Stage "${key}" failed or timed out — report will show data as unavailable`);
  });

  // ── Build Intelligence Packet ─────────────────────────────────────────────
  const packet = buildIntelligencePacket(input, data);
  emit('data_ready', { stage: 'packet', packet });

  // ── Generate AI Report ────────────────────────────────────────────────────
  emit('report_generating', { message: 'Analysing all collected data to generate feasibility report...' });
  
  const rawReport = await generateReport(packet);

  // ── Hallucination Firewall ────────────────────────────────────────────────
  const verifiedReport = runFirewall(rawReport, packet);

  const finalScore = verifiedReport['00_verdict_bar']?.score?.value || 0;
  const finalLabel = verifiedReport['00_verdict_bar']?.label || 'UNKNOWN';

  logger.info(`[Pipeline] ✅ Complete. Score: ${finalScore}/100 — ${finalLabel}`);

  return { packet, report: verifiedReport };
}

/**
 * Wraps a promise in a timeout. Returns null (never throws) if the promise times out.
 */
async function runWithTimeout(promise, ms, stageName) {
  let timeoutHandle;
  const timeout = new Promise(resolve => {
    timeoutHandle = setTimeout(() => {
      logger.warn(`[Pipeline] Stage "${stageName}" timed out after ${ms}ms`);
      resolve(null);
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    logger.error(`[Pipeline] Stage "${stageName}" threw: ${err.message}`);
    return null;
  }
}

module.exports = { runResearchPipeline };
