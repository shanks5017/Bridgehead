'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const { fetchWithRetry } = require('../utils/httpClient');
const crypto = require('crypto');
const logger = require('../utils/logger');

const MYSCHEME_API = 'https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&limit=100&offset=';
const DATAGOV_SCHEMES_RESOURCE = 'e6f98ea5-3f17-42f7-85a8-ed82e1eb56de';
const DATAGOV_BASE = `https://api.data.gov.in/resource/${DATAGOV_SCHEMES_RESOURCE}`;

const SCHEMES_SEED = [
  { schemeId: 'PM-KISAN', schemeName: 'Pradhan Mantri Kisan Samman Nidhi', ministry: 'Ministry of Agriculture and Farmers Welfare', description: 'Income support to all landholding farmer families.', benefit: '₹6000 per year', category: 'Agriculture' },
  { schemeId: 'PM-AWAS-G', schemeName: 'Pradhan Mantri Awaas Yojana - Gramin', ministry: 'Ministry of Rural Development', description: 'Housing for all in rural areas.', benefit: '₹1.2 Lakh subsidy', category: 'Housing' },
  { schemeId: 'AYUSHMAN', schemeName: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana', ministry: 'Ministry of Health and Family Welfare', description: 'Health insurance cover of ₹5 lakhs per family per year.', benefit: 'Up to ₹5 Lakh insurance', category: 'Health' },
  { schemeId: 'JJM', schemeName: 'Jal Jeevan Mission', ministry: 'Ministry of Jal Shakti', description: 'Functional Household Tap Connection to every rural household.', benefit: 'Tap water connection', category: 'General' },
  { schemeId: 'SBA', schemeName: 'Swachh Bharat Abhiyan', ministry: 'Ministry of Drinking Water and Sanitation', description: 'Universal sanitation coverage.', benefit: 'Toilet construction subsidy', category: 'General' }
];

class SchemesFetcher extends BaseFetcher {
  getId() { return 'Schemes'; }
  getTableName() { return 'gov_schemes'; }
  getConflictTarget() { return ['scheme_id']; }
  hasStateId() { return false; }
  hasDistrictId() { return false; }

  async fetchData() {
    // Try myScheme API first
    let records = await this._fetchFromMyScheme();
    if (records && records.length > 0) {
      logger.info(`[Schemes] Fetched ${records.length} records from myScheme API`);
      return records;
    }

    // Fallback to data.gov.in
    logger.warn('[Schemes] myScheme API returned no data — trying data.gov.in schemes catalog');
    records = await this._fetchFromDataGov();
    if (records && records.length > 0) {
      logger.info(`[Schemes] Fetched ${records.length} records from data.gov.in`);
      return records;
    }

    logger.warn('[Schemes] Both online sources failed — using curated national schemes seed');
    const seedRecords = SCHEMES_SEED.map(s => ({
      ...s,
      __source: 'india.gov.in-seed',
      state: 'All States'
    }));
    return seedRecords;
  }

  async _fetchFromMyScheme() {
    const records = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const resp = await fetchWithRetry(
          { method: 'GET', url: `${MYSCHEME_API}${offset}`, headers: { 'User-Agent': 'ZonekGovEngine/1.0' } },
          { retries: 3, baseDelay: 1000, module: 'Schemes/myScheme' }
        );

        const schemes = resp.data?.data?.schemes || resp.data?.schemes || resp.data || [];
        if (!Array.isArray(schemes) || schemes.length === 0) { hasMore = false; break; }

        // Tag each record with source
        schemes.forEach(s => s.__source = 'myscheme.gov.in');
        records.push(...schemes);

        offset += limit;
        if (schemes.length < limit) hasMore = false;
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        logger.warn(`[Schemes] myScheme API error: ${err.message}`);
        hasMore = false;
      }
    }
    return records;
  }

  async _fetchFromDataGov() {
    const API_KEY = process.env.DATA_GOV_KEY;
    if (!API_KEY) {
      logger.error('[Schemes] DATA_GOV_KEY missing for data.gov.in fallback');
      return [];
    }
    try {
      const resp = await fetchWithRetry(
        {
          method: 'GET',
          url: DATAGOV_BASE,
          params: { 'api-key': API_KEY, format: 'json', limit: 500 },
        },
        { retries: 3, baseDelay: 1500, module: 'Schemes/DataGov' }
      );
      const records = resp.data?.records || [];
      // Tag each record with source
      records.forEach(s => s.__source = 'data.gov.in');
      return records;
    } catch (err) {
      logger.error(`[Schemes] data.gov.in error: ${err.message}`);
      return [];
    }
  }

  transformRecord(raw) {
    const name = raw.schemeName || raw.scheme_name || raw.name || raw.title || '';
    if (!name) return null; // skip invalid

    const schemeId = raw.schemeId || raw.scheme_id || raw.id ||
      crypto.createHash('md5').update(name).digest('hex').slice(0, 12);

    const desc = raw.schemeDescription || raw.description || raw.details || '';
    const cat  = raw.category || this._inferCategory(`${name} ${desc}`);

    // Determine source from tag we added in fetchData
    const source = raw.__source || 'unknown';

    // Build applicableStates array and isNational flag
    let applicableStates = [];
    let isNational = false;
    const stateField = raw.state;
    if (stateField) {
      if (Array.isArray(stateField)) {
        applicableStates = stateField.map(s => String(s).trim()).filter(s => s);
      } else {
        const str = String(stateField).trim();
        if (str) applicableStates = [str];
      }
    }
    // If applicableStates empty or contains only 'All States' or similar, treat as national
    const lowerStates = applicableStates.map(s => s.toLowerCase());
    isNational = applicableStates.length === 0 ||
      lowerStates.some(s => s === 'all states' || s === '' || s === 'india');

    const benefitDesc = String(raw.benefit || raw.benefits || raw.schemeShortTitle || '').slice(0, 500);

    const doc = {
      scheme_id: schemeId,
      scheme_name: name.trim(),
      ministry: (raw.nodalMinistry || raw.ministry || raw.nodal_ministry || '').trim() || null,
      department: (raw.department || '').trim() || null,
      description: String(desc).slice(0, 2000),
      category: cat,
      tags: this._buildTags(`${name} ${desc}`),
      is_national: isNational,
      applicable_states: applicableStates.length > 0 ? applicableStates : null,
      application_url: raw.applicationUrl || raw.apply_url || raw.benefitApplicationProcess || null,
      benefit: {
        type: 'other',
        amount: null,
        description: benefitDesc,
      },
      source,
      last_updated: new Date().toISOString(),
      fetched_at: new Date().toISOString(),
    };

    return doc;
  }

  _inferCategory(text = '') {
    const lower = text.toLowerCase();
    const CATEGORY_KEYWORDS = {
      Agriculture: ['farm', 'crop', 'agri', 'kisan', 'soil', 'irrigation'],
      Business:    ['msme', 'entrepreneur', 'startup', 'business', 'trade', 'manufacture'],
      Education:   ['school', 'education', 'scholarship', 'student', 'college', 'skill'],
      Health:      ['health', 'hospital', 'medical', 'insurance', 'ayushman', 'maternity'],
      Housing:     ['housing', 'house', 'shelter', 'awas', 'pmay'],
      Women:       ['women', 'mahila', 'girl', 'female', 'mother'],
      Finance:     ['loan', 'credit', 'bank', 'mudra', 'subsidy', 'grant'],
    };
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      if (kws.some((k) => lower.includes(k))) return cat;
    }
    return 'General';
  }

  _buildTags(text = '') {
    const lower = text.toLowerCase();
    const tags = [];
    const CATEGORY_KEYWORDS = {
      Agriculture: ['farm', 'crop', 'agri', 'kisan', 'soil', 'irrigation'],
      Business:    ['msme', 'entrepreneur', 'startup', 'business', 'trade', 'manufacture'],
      Education:   ['school', 'education', 'scholarship', 'student', 'college', 'skill'],
      Health:      ['health', 'hospital', 'medical', 'insurance', 'ayushman', 'maternity'],
      Housing:     ['housing', 'house', 'shelter', 'awas', 'pmay'],
      Women:       ['women', 'mahila', 'girl', 'female', 'mother'],
      Finance:     ['loan', 'credit', 'bank', 'mudra', 'subsidy', 'grant'],
    };
    for (const kws of Object.values(CATEGORY_KEYWORDS)) {
      for (const kw of kws) { if (lower.includes(kw)) tags.push(kw); }
    }
    return [...new Set(tags)];
  }
}

module.exports = new SchemesFetcher();

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}