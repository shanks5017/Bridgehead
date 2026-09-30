'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const { fetchWithRetry } = require('../utils/httpClient');
const logger = require('../utils/logger');

const API_KEY = process.env.DATA_GOV_KEY || '579b464db66ec23bdd000001343ae0a078744bac6e6595accd519afa';

const COURT_RESOURCES = [
  'ncrb-district-courts-2023',
];

const COURT_SEED = [
  { state: 'Maharashtra', district: 'Pune', type: 'Civil', filed: 15400, disposed: 14200, pending: 45000, clearance: 92.2 },
  { state: 'Maharashtra', district: 'Pune', type: 'Criminal', filed: 22000, disposed: 19800, pending: 55000, clearance: 90.0 },
  { state: 'Karnataka', district: 'Bangalore Urban', type: 'Civil', filed: 18000, disposed: 16500, pending: 60000, clearance: 91.6 },
  { state: 'Karnataka', district: 'Bangalore Urban', type: 'Criminal', filed: 25000, disposed: 23500, pending: 70000, clearance: 94.0 },
  { state: 'Tamil Nadu', district: 'Chennai', type: 'Civil', filed: 12000, disposed: 11000, pending: 80000, clearance: 91.6 },
  { state: 'Tamil Nadu', district: 'Chennai', type: 'Criminal', filed: 19000, disposed: 18500, pending: 40000, clearance: 97.3 },
  { state: 'Delhi', district: 'New Delhi', type: 'Civil', filed: 45000, disposed: 42000, pending: 150000, clearance: 93.3 },
  { state: 'Delhi', district: 'New Delhi', type: 'Criminal', filed: 65000, disposed: 61000, pending: 180000, clearance: 93.8 },
];

class CourtsFetcher extends BaseFetcher {
  getId() { return 'Courts'; }
  getTableName() { return 'gov_courts'; }
  getConflictTarget() { return ['district_id', 'case_type', 'fetched_at']; }

  async fetchData() {
    const records = [];
    let apiSuccess = false;

    // Use a fixed snapshot date for the seed so it can't duplicate on same-month reruns
    const snapshotDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    for (const resourceId of COURT_RESOURCES) {
      try {
        const resp = await fetchWithRetry(
          {
            method: 'GET',
            url: `https://api.data.gov.in/resource/${resourceId}`,
            params: { 'api-key': API_KEY, format: 'json', limit: 500 },
          },
          { retries: 1, baseDelay: 1500, module: 'Courts/DataGov' }
        );
        const dgRecords = resp.data?.records || [];
        if (dgRecords.length > 0) {
          apiSuccess = true;
          logger.info(`[Courts] data.gov.in returned ${dgRecords.length} records`);
          for (const r of dgRecords) {
            const stateName = r.state_name || r.state || '';
            const districtName = r.district_name || r.district || '';
            const caseType = r.case_type || r.type || 'Civil';
            if (!stateName || !districtName) continue;
            records.push({
              stateName,
              districtName,
              caseType,
              casesFiled: parseInt(r.cases_filed || r.filed || 0) || null,
              casesDisposed: parseInt(r.cases_disposed || r.disposed || 0) || null,
              casesPending: parseInt(r.cases_pending || r.pending || 0) || null,
              clearanceRate: parseFloat(r.clearance_rate || r.clearance || 0) || null,
              source: 'data.gov.in/ncrb-courts',
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
    logger.warn('[Courts] No live court data from data.gov.in — using curated seed');
    if (!apiSuccess || records.length === 0) {
      for (const d of COURT_SEED) {
        records.push({
          stateName: d.state,
          districtName: d.district,
          caseType: d.type,
          casesFiled: d.filed,
          casesDisposed: d.disposed,
          casesPending: d.pending,
          clearanceRate: d.clearance,
          source: 'ncrb-njdg-seed',
          fetchedAt: snapshotDate,
        });
      }
    }
    return records;
  }

  transformRecord(raw) {
    return {
      stateName: raw.stateName,
      districtName: raw.districtName,
      case_type: raw.caseType,
      cases_filed: raw.casesFiled,
      cases_disposed: raw.casesDisposed,
      cases_pending: raw.casesPending,
      clearance_rate: raw.clearanceRate,
      source: raw.source,
      fetched_at: raw.fetchedAt,
    };
  }
}

module.exports = new CourtsFetcher();

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}