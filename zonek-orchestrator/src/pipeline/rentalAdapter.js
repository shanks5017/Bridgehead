'use strict';
/**
 * RENTAL ADAPTER
 * Calls the india_rental_scraper FastAPI service (port 8001).
 * Emits SSE events as platforms report results.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios  = require('axios');
const logger = require('../utils/logger');

const RENTAL_API = process.env.RENTAL_API_URL || 'http://localhost:8001';

const PLATFORM_DISPLAY = {
  olx:         'OLX',
  magicbricks: 'MagicBricks',
  acres99:     '99acres',
  nobroker:    'NoBroker',
  housing:     'Housing.com',
  proptiger:   'PropTiger',
  makaan:      'Makaan',
  quikrhomes:  'QuikrHomes',
};

async function runRentalScraper(input, emit) {
  const { location } = input;

  emit('stage_update', {
    stage: 'rentals',
    status: 'started',
    message: `Searching commercial rental listings in ${location}...`,
    platforms: Object.values(PLATFORM_DISPLAY),
  });

  // Emit individual platform URLs being scraped
  Object.values(PLATFORM_DISPLAY).forEach(name => {
    emit('stage_update', {
      stage: 'rentals',
      status: 'searching',
      url: getRentalUrl(name, location),
      message: `Scraping ${name} for commercial listings in ${location}`,
    });
  });

  try {
    const response = await axios.post(`${RENTAL_API}/api/v1/rentals`, {
      location,
      use_fast_geocode: false,
    }, { timeout: 60000 });

    const result = response.data;
    const listings = result.all_listings || [];
    const verified = result.verified_count || 0;

    // Emit per-platform results
    Object.entries(result.platforms || {}).forEach(([key, pdata]) => {
      const name = PLATFORM_DISPLAY[key] || key;
      emit('stage_update', {
        stage: 'rentals',
        status: pdata.status === 'ok' ? 'found' : 'empty',
        message: pdata.status === 'ok'
          ? `${name}: ${pdata.count} listings found`
          : `${name}: No listings found`,
        url: getRentalUrl(name, location),
      });
    });

    emit('data_ready', {
      stage: 'rentals',
      count: listings.length,
      verified,
      message: `${listings.length} rental listings found (${verified} location-verified)`,
    });

    logger.info(`[RentalAdapter] ✅ ${listings.length} listings found across ${Object.keys(result.platforms || {}).length} platforms`);
    return result;

  } catch (err) {
    logger.error(`[RentalAdapter] ❌ Failed: ${err.message}`);
    emit('stage_update', {
      stage: 'rentals',
      status: 'error',
      message: `Rental scraper unavailable: ${err.message}. Make sure to run: cd india_rental_scraper && uvicorn api:app --port 8001`,
    });
    return null;
  }
}

function getRentalUrl(platform, location) {
  const city = location.split(',').pop().trim().toLowerCase().replace(/\s+/g, '-');
  const urls = {
    'OLX':         `https://www.olx.in/${city}/commercial-property`,
    'MagicBricks': `https://www.magicbricks.com/commercial-property-for-rent-in-${city}`,
    '99acres':     `https://www.99acres.com/commercial-property-for-rent-in-${city}`,
    'NoBroker':    `https://www.nobroker.in/commercial-property/rent/${city}`,
    'Housing.com': `https://housing.com/rent/commercial-properties-in-${city}`,
    'PropTiger':   `https://www.proptiger.com/rent/commercial-property/${city}`,
    'Makaan':      `https://www.makaan.com/commercial-properties-for-rent/${city}`,
    'QuikrHomes':  `https://www.quikrhomes.com/commercial-space-for-rent-in-${city}.html`,
  };
  return urls[platform] || `https://www.olx.in/${city}`;
}

module.exports = { runRentalScraper };
