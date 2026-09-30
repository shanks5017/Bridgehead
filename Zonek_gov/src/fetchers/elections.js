'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const { fetchWithRetry } = require('../utils/httpClient');
const logger = require('../utils/logger');

const API_KEY = process.env.DATA_GOV_KEY || '579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa';

const ELECTION_RESOURCES = [
  'election-data-2024',
  'ec-general-election-2024',
];

const ELECTION_SEED = [
  { state: 'Uttar Pradesh', constituency: 'Varanasi', type: 'Lok Sabha', electors: 1963000, male: 1045000, female: 918000, turnout: 61.5 },
  { state: 'Maharashtra', constituency: 'Nagpur', type: 'Lok Sabha', electors: 2150000, male: 1100000, female: 1050000, turnout: 57.3 },
  { state: 'Kerala', constituency: 'Wayanad', type: 'Lok Sabha', electors: 1350000, male: 660000, female: 690000, turnout: 73.5 },
  { state: 'Gujarat', constituency: 'Gandhinagar', type: 'Lok Sabha', electors: 1850000, male: 970000, female: 880000, turnout: 66.2 },
  { state: 'Tamil Nadu', constituency: 'Coimbatore', type: 'Lok Sabha', electors: 2000000, male: 1020000, female: 980000, turnout: 68.1 }
];

class ElectionsFetcher extends BaseFetcher {
  getId() { return 'Elections'; }
  getTableName() { return 'gov_elections'; }
  getConflictTarget() { return ['state_id', 'constituency_name', 'constituency_type', 'fetched_at']; }
  hasDistrictId() { return false; }

  async fetchData() {
    const records = [];
    let apiSuccess = false;

    // Use a fixed snapshot date for the seed so it doesn't duplicate endlessly
    const snapshotDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Try data.gov.in
    for (const resourceId of ELECTION_RESOURCES) {
      try {
        const resp = await fetchWithRetry(
          {
            method: 'GET',
            url: `https://api.data.gov.in/resource/${resourceId}`,
            params: { 'api-key': API_KEY, format: 'json', limit: 500 },
          },
          { retries: 1, baseDelay: 1500, module: 'Elections/DataGov' }
        );
        const dgRecords = resp.data?.records || [];
        if (dgRecords.length > 0) {
          apiSuccess = true;
          logger.info(`[Elections] data.gov.in returned ${dgRecords.length} records`);
          for (const r of dgRecords) {
            const stateName = r.state_name || r.state || '';
            const constituency = r.constituency_name || r.constituency || '';
            const constituencyType = r.constituency_type || r.type || 'Lok Sabha';
            if (!stateName || !constituency) continue;
            records.push({
              stateName,
              constituencyName: constituency,
              constituencyType,
              totalElectors: parseInt(r.total_electors || r.electors || 0) || null,
              maleElectors: parseInt(r.male_electors || 0) || null,
              femaleElectors: parseInt(r.female_electors || 0) || null,
              voterTurnoutPct: parseFloat(r.voter_turnout || r.turnout_pct || 0) || null,
              source: 'data.gov.in/elections',
              fetchedAt: snapshotDate,
            });
          }
          return records;
        }
      } catch (err) {
        if (err.message.includes('403') || err.message.includes('401')) {
          break; // Abort on auth failure
        }
      }
    }

    if (!apiSuccess || records.length === 0) {
      logger.info('[Elections] No live election data available from data.gov.in — using curated seed');
      for (const d of ELECTION_SEED) {
        records.push({
          stateName: d.state,
          constituencyName: d.constituency,
          constituencyType: d.type,
          totalElectors: d.electors,
          maleElectors: d.male,
          femaleElectors: d.female,
          voterTurnoutPct: d.turnout,
          source: 'ec-nic-seed',
          fetchedAt: snapshotDate,
        });
      }
    }
    return records;
  }

  transformRecord(raw) {
    return {
      stateName: raw.stateName,
      constituency_name: raw.constituencyName,
      constituency_type: raw.constituencyType,
      total_electors: raw.totalElectors,
      male_electors: raw.maleElectors,
      female_electors: raw.femaleElectors,
      voter_turnout_pct: raw.voterTurnoutPct,
      source: raw.source,
      fetched_at: raw.fetchedAt,
    };
  }
}

module.exports = new ElectionsFetcher();

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}