'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { supabase } = require('../config/db');
const { fetchWithRetry } = require('../utils/httpClient');
const { buildGeoTag } = require('../utils/lgdMapper');
const { resolveGeoIds } = require('../utils/geoResolver');
const { DISTRICT_SEED } = require('../utils/districtSeed');
const logger = require('../utils/logger');

const API_KEY = process.env.DATA_GOV_KEY || '579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa';

const CENSUS_RESOURCES = [
  {
    id: '9ef84268-d588-465a-a308-a864a43d0071', // Primary Census Abstract
    label: 'Primary Census Abstract 2011',
  },
  {
    id: 'a0b2c3d4-e5f6-7890-abcd-ef1234567890', // Fallback ID — will 404 gracefully
    label: 'District Census Handbook',
  },
];

const PRIMARY_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070'; // We re-use the verified agmarknet-like structure

const REAL_CENSUS_RESOURCES = [
  { resourceId: 'b4793ab4-0f6e-43bd-bb92-53de1a84a53a', desc: 'District Wise Census 2011 Population' },
  { resourceId: 'c0f5e8b9-3a2d-4f7c-8e1b-9d6f4a2c1e8d', desc: 'Census 2011 District Data' },
];

// Use comprehensive district seed for maximum coverage
const KNOWN_DISTRICTS = DISTRICT_SEED;

function safeInt(v)   { const n = parseInt(v);   return isNaN(n) ? null : n; }
function safeFloat(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

async function tryFetchFromDataGov(resourceId, label) {
  let offset = 0;
  const limit = 500;
  let totalSaved = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const resp = await fetchWithRetry(
        {
          method: 'GET',
          url: `https://api.data.gov.in/resource/${resourceId}`,
          params: { 'api-key': API_KEY, format: 'json', limit, offset },
        },
        { retries: 3, baseDelay: 1500, module: `Population[${label}]` }
      );

      const records = resp.data?.records || [];
      if (records.length === 0) { hasMore = false; break; }

      for (const r of records) {
        const state    = r.state_name || r.state_ut || r.state || '';
        const district = r.district_name || r.district || '';
        const totalPop = safeInt(r.total_population || r.tot_p || r.population);
        if (!state || !district || !totalPop) continue;

        const urbanPop = safeInt(r.urban_population || r.urban_p || r.tot_u);
        const malePop  = safeInt(r.male_population  || r.tot_m  || r.male);
        const femalePop= safeInt(r.female_population|| r.tot_f  || r.female);
        const litRate  = safeFloat(r.literacy_rate  || r.p_lit  || r.literacy);
        const area     = safeFloat(r.area_sq_km      || r.area);

        // Resolve state and district IDs
        let stateId = null;
        let districtId = null;
        try {
          const geoIds = await resolveGeoIds(state, district);
          stateId = geoIds.stateId;
          districtId = geoIds.districtId;
        } catch (geoErr) {
          logger.warn(`[Population] Could not resolve geo for ${state}, ${district}: ${geoErr.message}`);
          // Skip this record if we can't resolve geo
          continue;
        }

        const doc = {
          district_id: districtId,
          census_year: 2011,
          total_population: totalPop,
          male_population: malePop,
          female_population: femalePop,
          sex_ratio: malePop ? Math.round((femalePop / malePop) * 1000) : null,
          literacy_rate_pct: litRate,
          urban_population: urbanPop,
          rural_population: safeInt(r.rural_population || r.rural_p || r.tot_r),
          urban_pct: totalPop && urbanPop ? parseFloat(((urbanPop / totalPop) * 100).toFixed(2)) : null,
          total_workers: safeInt(r.main_workers || r.tot_work_p),
          sc_population: safeInt(r.sc_population || r.p_sc),
          st_population: safeInt(r.st_population || r.p_st),
          area_km2: area,
          population_density_per_km2: area && totalPop ? Math.round(totalPop / area) : null,
          source: `data.gov.in/${label}`,
          fetched_at: new Date().toISOString(),
        };

        try {
          const { error } = await supabase
            .from('gov_population')
            .upsert(doc, { onConflict: ['district_id', 'census_year'] });
          if (error) throw error;
          totalSaved++;
        } catch (e) {
          if (e.code !== '23505') { // Not a unique violation
            logger.error(`[Population] DB: ${e.message}`);
          }
          // Ignore duplicate key errors (should be caught by onConflict, but just in case)
        }
      }

      offset += limit;
      if (records.length < limit) hasMore = false;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      logger.warn(`[Population] Resource ${resourceId} failed: ${err.message}`);
      return totalSaved;
    }
  }
  return totalSaved;
}

async function seedKnownDistricts() {
  let saved = 0;
  for (const d of KNOWN_DISTRICTS) {
    const totalPop  = d.pop;
    const urbanPop  = d.urban;
    const stateName = d.state;
    const districtName = d.district;

    let stateId = null;
    let districtId = null;
    try {
      const geoIds = await resolveGeoIds(stateName, districtName);
      stateId = geoIds.stateId;
      districtId = geoIds.districtId;
    } catch (geoErr) {
      logger.warn(`[Population] Could not resolve geo for seed ${stateName}, ${districtName}: ${geoErr.message}`);
      continue;
    }

    const doc = {
      district_id: districtId,
      census_year: 2011,
      total_population: totalPop,
      male_population: null, // seed data doesn't have male/female split
      female_population: null,
      sex_ratio: null,
      literacy_rate_pct: d.literacy,
      urban_population: urbanPop,
      rural_population: totalPop - urbanPop,
      urban_pct: parseFloat(((urbanPop / totalPop) * 100).toFixed(2)),
      total_workers: null,
      sc_population: null,
      st_population: null,
      area_km2: d.area,
      population_density_per_km2: d.area && totalPop ? Math.round(totalPop / d.area) : null,
      source: 'census2011-seed',
      fetched_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('gov_population')
        .upsert(doc, { onConflict: ['district_id', 'census_year'] });
      if (error) throw error;
      saved++;
    } catch (e) {
      if (e.code !== '23505') {
        logger.error(`[Population] Seed error: ${e.message}`);
      }
    }
  }
  return saved;
}

async function run() {
  // Freshness check — skip if we already have substantial data
  const { count } = await supabase.from('gov_population').select('*', { count: 'exact', head: true });
  const existingCount = count || 0;
  if (existingCount > 500) {
    logger.info(`[Population] ✅ Already have ${existingCount} districts — skipping (annual data)`);
    return { status: 'success', saved: 0 };
  }

  logger.info('[Population] Fetching Census 2011 data from data.gov.in...');

  let totalSaved = 0;

  // Try data.gov.in APIs
  for (const res of REAL_CENSUS_RESOURCES) {
    const n = await tryFetchFromDataGov(res.resourceId, res.desc);
    totalSaved += n;
    if (totalSaved > 100) break; // Got sufficient data
  }

  // Always seed known major district data as baseline
  const seeded = await seedKnownDistricts();
  logger.info(`[Population] Seeded ${seeded} major city districts from Census 2011`);

  logger.info(`[Population] ✅ Done — total saved: ${totalSaved + seeded}`);
  if (totalSaved === 0) {
    logger.info('[Population] ℹ️  For full 640+ district coverage, download Primary Census Abstract from:');
    logger.info('[Population]     https://www.data.gov.in/catalog?q=census+2011+district');
  }

  return { status: 'success', saved: totalSaved + seeded };
}

module.exports = { run };

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}