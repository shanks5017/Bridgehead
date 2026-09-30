'use strict';
/**
 * ZONEK BROWSER — MAIN ORCHESTRATOR
 * Coordinates search groups, page reading, AI extraction, and caching.
 */

const pLimit = require('p-limit');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { buildQueryGroups } = require('./queries/queryBuilder');
const { unifiedSearch } = require('./search/searchProvider');
const { jinaRead } = require('./search/jina');
const { extractFacts } = require('./extractor/aiExtractor');
const { generateQueryHash, createIntelligencePacket } = require('./normalizer/normalize');
const BrowserCache = require('./models/BrowserCache');

const limit = pLimit(parseInt(process.env.BROWSER_CONCURRENCY) || 3);

/**
 * Execute a single query group (3 queries).
 */
async function processGroup(groupId, groupData, businessType, location) {
  logger.info(`[Browser] Starting group: ${groupData.label}`);
  
  const allResults = [];
  let sourcesChecked = 0;

  // Search for each query in the group
  for (const query of groupData.queries) {
    try {
      const searchHits = await unifiedSearch(query, 3);
      sourcesChecked += searchHits.length;
      allResults.push(...searchHits);
    } catch (err) {
      logger.error(`[Browser] Search failed for "${query}": ${err.message}`);
    }
  }

  // Deduplicate URLs
  const uniqueUrls = [...new Set(allResults.map(r => r.url))].slice(0, 3);
  const findings = [];

  // Extract facts from top 3 unique URLs
  await Promise.all(uniqueUrls.map(url => limit(async () => {
    try {
      // 1. Read page content
      logger.info(`[Browser] Reading: ${url}`);
      const page = await jinaRead(url);
      if (!page) {
        logger.warn(`[Browser] No content for: ${url}`);
        return;
      }

      // 2. Extract facts via AI
      logger.info(`[Browser] Extracting facts from: ${page.title || url}`);
      const extracted = await extractFacts(page.content, groupData.label, businessType, location);
      
      logger.info(`[Browser] Extracted ${extracted.length} facts from: ${url}`);
      extracted.forEach(fact => {
        findings.push({
          fact,
          source_url: url,
          source_name: page.title || new URL(url).hostname,
          scraped_at: new Date().toISOString()
        });
      });
    } catch (err) {
      logger.warn(`[Browser] Extraction failed for ${url}: ${err.message}`);
    }
  })));

  return {
    label: groupData.label,
    findings,
    sourcesChecked
  };
}

/**
 * MAIN ENTRY POINT
 * runs full browser intelligence for a business + location.
 */
async function run(businessType, location) {
  const hash = generateQueryHash(businessType, location);
  
  try {
    await connectDB();

    // 1. Check Cache
    const cached = await BrowserCache.findOne({ queryHash: hash });
    if (cached) {
      logger.info(`[Browser] ⚡ Cache Hit for ${businessType} in ${location}`);
      return cached.packet;
    }

    // 2. Build Query Groups
    const groups = buildQueryGroups(businessType, location);
    const groupResults = {};

    // 3. Process Groups with concurrency limit
    const groupPromises = Object.entries(groups).map(([id, data]) => 
      limit(async () => {
        const res = await processGroup(id, data, businessType, location);
        groupResults[id] = res;
      })
    );

    await Promise.all(groupPromises);

    // 4. Create Packet
    const packet = createIntelligencePacket(businessType, location, groupResults);

    // 5. Save to Cache (upsert to prevent E11000 duplicate key crash on re-runs)
    await BrowserCache.findOneAndUpdate(
      { queryHash: hash },
      { queryHash: hash, businessType, location, packet },
      { upsert: true, new: true }
    );

    return packet;
  } catch (err) {
    logger.error(`[Browser] Fatal error: ${err.message}`);
    throw err;
  } finally {
    await disconnectDB();
  }
}

// ── Test Mode ─────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  
  if (isTest) {
    const bt = 'Cafe';
    const loc = 'RS Puram, Coimbatore';
    logger.info(`[Browser] Running test for: ${bt} @ ${loc}`);
    run(bt, loc)
      .then(res => {
        console.log('\nFinal Intelligence Packet:');
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  }
}

module.exports = { run };
