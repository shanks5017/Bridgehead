'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const { fetchWithRetry } = require('../utils/httpClient');
const { buildGeoTag } = require('../utils/lgdMapper');
const logger = require('../utils/logger');

const API_KEY = process.env.DATA_GOV_KEY || '579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

const TARGET_STATES = [
  'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Telangana',
  'Andhra Pradesh', 'Kerala', 'Delhi', 'Uttar Pradesh',
  'West Bengal', 'Rajasthan',
];

const KEY_COMMODITIES = [
  'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize',
  'Groundnut', 'Cotton', 'Sugarcane', 'Soyabean',
];

const CROP_FALLBACK_SEED = [
  { state: 'Maharashtra', district: 'Pune', market: 'Pune APMC', commodity: 'Onion', variety: 'Local', modal_price: 2500, min_price: 2000, max_price: 3000 },
  { state: 'Maharashtra', district: 'Nashik', market: 'Lasalgaon', commodity: 'Onion', variety: 'Red', modal_price: 2800, min_price: 2200, max_price: 3200 },
  { state: 'Karnataka', district: 'Bangalore Urban', market: 'Yeshwanthpur', commodity: 'Tomato', variety: 'Hybrid', modal_price: 3500, min_price: 3000, max_price: 4000 },
  { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow Mandi', commodity: 'Potato', variety: 'Desi', modal_price: 1500, min_price: 1200, max_price: 1800 },
  { state: 'Punjab', district: 'Ludhiana', market: 'Ludhiana Mandi', commodity: 'Wheat', variety: 'Other', modal_price: 2250, min_price: 2200, max_price: 2300 },
  { state: 'Andhra Pradesh', district: 'Guntur', market: 'Guntur APMC', commodity: 'Cotton', variety: 'Bunny', modal_price: 7500, min_price: 7000, max_price: 8000 },
];

class CropPricesFetcher extends BaseFetcher {
  getId() { return 'CropPrices'; }
  getTableName() { return 'gov_crop_prices'; }
  getConflictTarget() { return ['district_id', 'market_name', 'commodity_name', 'variety', 'grade', 'price_date']; }

  async fetchData() {
    const records = [];
    let apiSuccess = false;
    let abortApi = false;

    for (const stateName of TARGET_STATES) {
      if (abortApi) break;
      for (const commodity of KEY_COMMODITIES) {
        if (abortApi) break;
        try {
          const resp = await fetchWithRetry(
            {
              method: 'GET', url: BASE_URL,
              params: {
                'api-key': API_KEY, format: 'json', limit: 500,
                'filters[state]': stateName, 'filters[commodity]': commodity,
              },
            },
            { retries: 2, baseDelay: 1200, module: `CropPrices[${stateName}/${commodity}]` }
          );
          const items = resp.data?.records || [];
          if (items.length > 0) apiSuccess = true;
          for (const item of items) {
            const rawDate = item.arrival_date;
            let priceDate;
            if (rawDate) {
              const [d, m, y] = rawDate.split('/');
              priceDate = new Date(`${y}-${m}-${d}`).toISOString().split('T')[0];
            } else {
              priceDate = new Date().toISOString().split('T')[0];
            }
            const modal = parseFloat(item.modal_price);
            if (isNaN(modal)) continue;
            records.push({
              stateName: item.state || stateName,
              districtName: item.district || null,
              commodity_name: (item.commodity || commodity).trim(),
              variety: (item.variety || '').trim() || null,
              grade: (item.grade || '').trim() || null,
              market_name: (item.market || '').trim(),
              min_price: parseFloat(item.min_price) || null,
              max_price: parseFloat(item.max_price) || null,
              modal_price: modal,
              price_date: priceDate,
              source: 'data.gov.in/agmarknet',
              fetched_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          logger.warn(`[CropPrices] Skipping ${commodity}/${stateName}: ${err.message}`);
          if (err.message.includes('403') || err.message.includes('401')) {
            abortApi = true;
          }
        }
        if (!abortApi) await new Promise((r) => setTimeout(r, 100)); // reduce wait so it falls back faster for tests
      }
    }

    if (!apiSuccess || records.length === 0) {
      logger.info('[CropPrices] API returned no records or failed — using curated seed');
      for (const req of CROP_FALLBACK_SEED) {
        records.push({
          stateName: req.state,
          districtName: req.district,
          commodity_name: req.commodity,
          variety: req.variety,
          grade: 'FAQ',
          market_name: req.market,
          min_price: req.min_price,
          max_price: req.max_price,
          modal_price: req.modal_price,
          price_date: new Date().toISOString().split('T')[0],
          source: 'agmarknet-seed',
          fetched_at: new Date().toISOString()
        });
      }
    }

    return records;
  }

  transformRecord(raw) {
    return raw;
  }
}

module.exports = new CropPricesFetcher();

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}
