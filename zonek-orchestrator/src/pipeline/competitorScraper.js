'use strict';
/**
 * COMPETITOR SCRAPER (PLAYWRIGHT)
 * Scrapes Justdial for local competitors using Playwright for JS rendering.
 * Bypasses basic blocks and correctly extracts JSON-LD or DOM data.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { chromium } = require('playwright');
const logger = require('../utils/logger');

const JUSTDIAL_BASE = 'https://www.justdial.com';

const BUSINESS_SLUG_MAP = {
  'cafe':          'cafes',
  'coffee':        'cafes',
  'restaurant':    'restaurants',
  'food':          'restaurants',
  'gym':           'gyms',
  'fitness':       'gyms',
  'salon':         'beauty-parlours',
  'beauty':        'beauty-parlours',
  'pharmacy':      'medical-stores',
  'grocery':       'grocery-stores',
  'bakery':        'bakeries',
  'tuition':       'tuition-institutes',
  'coaching':      'coaching-institutes',
  'hotel':         'hotels',
  'cloud kitchen': 'restaurants',
};

function getJustdialSlug(businessType) {
  const lower = businessType.toLowerCase();
  for (const [key, slug] of Object.entries(BUSINESS_SLUG_MAP)) {
    if (lower.includes(key)) return slug;
  }
  return businessType.toLowerCase().replace(/\s+/g, '-') + 's';
}

async function runCompetitorScraper(input, emit) {
  const { businessType, location } = input;

  const parts  = location.split(',').map(s => s.trim());
  const city   = parts[parts.length - 1];
  const area   = parts.length > 1 ? parts[0] : '';

  const slug   = getJustdialSlug(businessType);
  const citySlug = city.replace(/\s+/g, '-');
  const areaSlug = area.replace(/\s+/g, '-');

  const jdUrl = areaSlug
    ? `${JUSTDIAL_BASE}/${citySlug}/${slug}/${areaSlug}`
    : `${JUSTDIAL_BASE}/${citySlug}/${slug}`;

  emit('stage_update', {
    stage: 'competitors',
    status: 'searching',
    url: jdUrl,
    message: `Deploying Headless Browser to scrape Justdial for ${businessType} competitors...`,
  });

  let browser = null;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-http2', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    
    // Go to URL and wait until load (ensure all dynamic elements are there)
    await page.goto(jdUrl, { waitUntil: 'load', timeout: 45000 });
    
    // Wait briefly for any lazy-loaded JS execution
    await page.waitForTimeout(2000);

    const html = await page.content();
    const competitors = parseJustdialHTML(html, businessType, location);

    if (competitors.length > 0) {
      emit('data_ready', {
        stage: 'competitors',
        count: competitors.length,
        topNames: competitors.slice(0, 3).map(c => c.name),
        message: `Playwright extracted ${competitors.length} competitors directly from rendered DOM.`,
        url: jdUrl,
      });
      logger.info(`[CompetitorScraper] ✅ ${competitors.length} competitors found via Playwright`);
      return { count: competitors.length, competitors, source: 'justdial', url: jdUrl, scraped_at: new Date().toISOString() };
    }

    logger.warn('[CompetitorScraper] ⚠️ Playwright loaded the page but found no competitors. Location or category might be empty.');
    return {
      count: 0,
      competitors: [],
      source: 'justdial',
      url: jdUrl,
      scraped_at: new Date().toISOString(),
      note: 'Headless browser executed successfully but no relevant listings were found.',
    };

  } catch (err) {
    logger.error(`[CompetitorScraper] ❌ Playwright failed: ${err.message}`);
    emit('stage_update', {
      stage: 'competitors',
      status: 'error',
      url: jdUrl,
      message: `Headless scrape failed: ${err.message}`,
    });
    return { count: 0, competitors: [], source: 'justdial', url: jdUrl, error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Parse Justdial HTML for business listings (JSON-LD and DOM fallback).
 */
function parseJustdialHTML(html, businessType, location) {
  const competitors = [];

  try {
    // 1. Try extracting JSON-LD structured data (fast and highly accurate)
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];

    for (const block of jsonLdMatches) {
      try {
        const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, '').trim());
        const items = Array.isArray(json) ? json : [json];

        for (const item of items) {
          if (item['@type'] === 'LocalBusiness' || item.name) {
            competitors.push({
              name:       item.name || 'Unknown',
              address:    item.address?.streetAddress || location,
              rating:     parseFloat(item.aggregateRating?.ratingValue) || null,
              reviews:    parseInt(item.aggregateRating?.reviewCount) || 0,
              phone:      Array.isArray(item.telephone) ? item.telephone[0] : item.telephone || null,
              url:        item.url || null,
              source:     'justdial',
              scraped_at: new Date().toISOString(),
            });
          }
        }
      } catch { /* skip malformed JSON-LD */ }
    }

    // 2. Fallback to DOM parsing if JSON-LD is missing (common with SPAs)
    if (competitors.length === 0) {
      // Justdial often uses classes like "resultbox_title_anchor" or "store-name"
      const nameMatches = html.match(/class="[^"]*(resultbox_title_anchor|store-name|jcn)[^"]*"[^>]*>([^<]+)</gi) || [];
      nameMatches.slice(0, 15).forEach(match => {
        const name = match.replace(/^[^>]+>/, '').trim();
        if (name && name.length > 2 && !competitors.some(c => c.name === name)) {
          competitors.push({ name, source: 'justdial', scraped_at: new Date().toISOString() });
        }
      });
    }
  } catch (err) {
    logger.warn(`[CompetitorScraper] HTML parse error: ${err.message}`);
  }

  // Deduplicate by name
  const unique = [];
  const names = new Set();
  for (const c of competitors) {
    if (!names.has(c.name)) {
      names.add(c.name);
      unique.push(c);
    }
  }

  return unique.slice(0, 20); // cap at 20
}

module.exports = { runCompetitorScraper };
