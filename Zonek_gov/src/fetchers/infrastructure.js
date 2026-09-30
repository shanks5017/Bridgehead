'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const RSSParser = require('rss-parser');
const crypto = require('crypto');
const { resolveGeoIds } = require('../utils/geoResolver');
const logger = require('../utils/logger');

const parser = new RSSParser({ timeout: 20000 });

const RSS_FEEDS = [
  { url: 'https://news.google.com/rss/search?q=infrastructure+India&hl=en-IN&gl=IN&ceid=IN:en', tag: 'general' },
  { url: 'https://news.google.com/rss/search?q=infrastructure+Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:en', tag: 'roads', state: 'Tamil Nadu' },
  { url: 'https://news.google.com/rss/search?q=roads+metro+construction+South+India&hl=en-IN&gl=IN&ceid=IN:en', tag: 'metro' },
  { url: 'https://news.google.com/rss/search?q=infrastructure+Karnataka&hl=en-IN&gl=IN&ceid=IN:en', tag: 'roads', state: 'Karnataka' },
  { url: 'https://news.google.com/rss/search?q=infrastructure+Maharashtra&hl=en-IN&gl=IN&ceid=IN:en', tag: 'roads', state: 'Maharashtra' },
  { url: 'https://news.google.com/rss/search?q=PMAY+housing+india&hl=en-IN&gl=IN&ceid=IN:en', tag: 'general' },
  { url: 'https://news.google.com/rss/search?q=metro+rail+india&hl=en-IN&gl=IN&ceid=IN:en', tag: 'metro' },
  { url: 'https://news.google.com/rss/search?q=industrial+park+india+2025&hl=en-IN&gl=IN&ceid=IN:en', tag: 'industrial' },
];

function extractStates(text = '') {
  const lower = text.toLowerCase();
  // We'll reuse the lgdMapper's state list; but we don't have it here. We'll duplicate list or import.
  // For simplicity, we'll use a hardcoded list of state names from lgdMapper.
  const STATE_LIST = [
    'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat',
    'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh',
    'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
    'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh',
    'uttarakhand', 'west bengal', 'delhi', 'jammu and kashmir', 'ladakh'
  ];
  return STATE_LIST.filter((s) => lower.includes(s));
}

function classifyCategory(title = '', description = '') {
  const t = `${title} ${description}`.toLowerCase();
  if (t.includes('metro') || t.includes('rapid transit')) return 'metro';
  if (t.includes('road') || t.includes('highway') || t.includes('expressway')) return 'roads';
  if (t.includes('railway') || t.includes('train') || t.includes('irctc')) return 'railway';
  if (t.includes('port') || t.includes('harbour')) return 'port';
  if (t.includes('airport') || t.includes('airstrip')) return 'airport';
  if (t.includes('power') || t.includes('electricity') || t.includes('solar')) return 'power';
  if (t.includes('water') || t.includes('dam') || t.includes('river')) return 'water';
  if (t.includes('telecom') || t.includes('5g') || t.includes('optical fibre')) return 'telecom';
  if (t.includes('industrial') || t.includes('sez') || t.includes('factory')) return 'industrial';
  return 'general';
}

class InfrastructureFetcher extends BaseFetcher {
  getId() { return 'Infrastructure'; }
  getTableName() { return 'gov_infrastructure_news'; }
  getConflictTarget() { return ['url']; }
  hasStateId() { return false; }
  hasDistrictId() { return false; }

  async fetchData() {
    const records = [];
    for (const feed of RSS_FEEDS) {
      try {
        const feedData = await parser.parseURL(feed.url);
        const items = feedData.items || [];

        for (const item of items) {
          if (!item.link) continue;

          const title = item.title || '';
          const description = item.contentSnippet || item.content || '';
          const mentionedStates = extractStates(`${title} ${description}`);
          const feedState = feed.state;
          const allStates = [...new Set([...mentionedStates, ...(feedState ? [feedState] : [])])];
          // Take first state for state_id
          const primaryStateName = allStates[0] || null;

          let stateId = null;
          if (primaryStateName) {
            try {
              const { stateId: sid } = await resolveGeoIds(primaryStateName, null);
              stateId = sid;
            } catch (err) {
              logger.warn(`[Infrastructure] Could not resolve state ${primaryStateName}: ${err.message}`);
            }
          }

          const record = {
            title: title.slice(0, 500),
            description: description.slice(0, 1000) || null,
            url: item.link,
            source: feedData.title || item.creator || null,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            fetched_at: new Date().toISOString(),
          };

          if (stateId !== null) {
            record.state_id = stateId;
          }

          records.push(record);
        }

        logger.info(`[Infrastructure] Feed [${feed.tag}]: ${items.length} items`);
        // Polite delay between RSS fetches
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        logger.warn(`[Infrastructure] Feed error [${feed.url.slice(0, 60)}]: ${err.message}`);
      }
    }

    // Deduplicate by URL before returning to avoid ON CONFLICT errors
    const uniqueRecords = [];
    const seenUrls = new Set();
    for (const r of records) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        uniqueRecords.push(r);
      }
    }
    return uniqueRecords;
  }

  transformRecord(raw) {
    return raw;
  }
}

module.exports = new InfrastructureFetcher();

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}