'use strict';
/**
 * GOV DATA ADAPTER
 * Queries the Zonek_gov MongoDB directly (no HTTP hop needed — same machine).
 * Resolves location to district/state for filtering.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI_GOV || 'mongodb://127.0.0.1:27017/zonek_gov';

// ── Lazy connection ───────────────────────────────────────────────────────────
let govConn = null;
async function getGovDB() {
  if (govConn && govConn.readyState === 1) return govConn;
  govConn = await mongoose.createConnection(MONGO_URI, { maxPoolSize: 3, serverSelectionTimeoutMS: 5000 });
  logger.info('[GovAdapter] Connected to Zonek_gov MongoDB');
  return govConn;
}

// ── Model Schemas (minimal — only fields we need) ─────────────────────────────
const weatherSchema   = new mongoose.Schema({}, { strict: false, collection: 'weather' });
const schemeSchema    = new mongoose.Schema({}, { strict: false, collection: 'schemes' });
const jjmSchema       = new mongoose.Schema({}, { strict: false, collection: 'jjmData' });
const pmaySchema      = new mongoose.Schema({}, { strict: false, collection: 'pmayData' });
const schoolSchema    = new mongoose.Schema({}, { strict: false, collection: 'schoolData' });
const budgetSchema    = new mongoose.Schema({}, { strict: false, collection: 'budgetData' });
const cropSchema      = new mongoose.Schema({}, { strict: false, collection: 'cropPrices' });
const infraSchema     = new mongoose.Schema({}, { strict: false, collection: 'newsInfrastructure' });

async function runGovDataQuery(input, emit) {
  const { location, businessType } = input;

  // Resolve city/state from location string
  const parts = location.split(',').map(s => s.trim());
  const area  = parts[0];
  let city    = parts[parts.length - 1];

  // Resolve state if city is known (for better coverage of state-level data)
  const cityToState = {
    'coimbatore': 'Tamil Nadu',
    'chennai': 'Tamil Nadu',
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'hyderabad': 'Telangana',
    'mumbai': 'Maharashtra',
    'pune': 'Maharashtra',
    'ahmedabad': 'Gujarat',
    'surat': 'Gujarat',
    'jaipur': 'Rajasthan',
    'lucknow': 'Uttar Pradesh',
    'kanpur': 'Uttar Pradesh',
    'kolkata': 'West Bengal',
    'delhi': 'Delhi',
    'gurgaon': 'Haryana',
    'noida': 'Uttar Pradesh',
    'bhopal': 'Madhya Pradesh',
    'indore': 'Madhya Pradesh',
    'patna': 'Bihar',
  };

  const resolvedState = cityToState[city.toLowerCase()];
  const stateRegex = resolvedState ? new RegExp(resolvedState, 'i') : null;


  emit('stage_update', {
    stage: 'gov',
    status: 'started',
    message: `Fetching government data for ${city}...`,
    url: 'jaljeevanmission.gov.in',
  });

  try {
    const db = await getGovDB();

    const Weather     = db.model('Weather',     weatherSchema);
    const Scheme      = db.model('Scheme',      schemeSchema);
    const JJM         = db.model('JJM',         jjmSchema);
    const PMAY        = db.model('PMAY',        pmaySchema);
    const School      = db.model('School',      schoolSchema);
    const Budget      = db.model('Budget',      budgetSchema);
    const CropPrice   = db.model('CropPrice',   cropSchema);
    const InfraNews   = db.model('InfraNews',   infraSchema);

    const cityLower   = city.toLowerCase();
    const cityRegex   = new RegExp(city, 'i');

    emit('stage_update', { stage: 'gov', status: 'searching', url: 'openmeteo.com', message: 'Loading weather & rainfall data...' });
    emit('stage_update', { stage: 'gov', status: 'searching', url: 'jaljeevanmission.gov.in', message: 'Fetching Jal Jeevan Mission (water coverage) data...' });
    emit('stage_update', { stage: 'gov', status: 'searching', url: 'pmayg.nic.in', message: 'Fetching PMAY housing data...' });
    emit('stage_update', { stage: 'gov', status: 'searching', url: 'myscheme.gov.in', message: `Finding government schemes for ${businessType}...` });

    // Parallel DB queries
    const [weather, schemes, jjm, pmay, schools, budget, cropPrices, infraNews] = await Promise.all([
      Weather.findOne({ $or: [{ city: cityRegex }, { 'geo.stateName': cityRegex }, { 'geo.districtName': cityRegex }, { 'geo.stateName': stateRegex }] }).lean().catch(() => null),
      Scheme.find({ $or: [{ applicableStates: cityRegex }, { applicableStates: stateRegex }, { category: new RegExp(businessType, 'i') }, { tags: new RegExp(businessType, 'i') }, { tags: 'business' }] }).limit(20).lean().catch(() => []),
      JJM.findOne({ $or: [{ 'geo.districtName': cityRegex }, { 'geo.stateName': cityRegex }, { 'geo.stateName': stateRegex }] }).sort({ asOfDate: -1 }).lean().catch(() => null),
      PMAY.findOne({ $or: [{ 'geo.districtName': cityRegex }, { 'geo.stateName': cityRegex }, { 'geo.stateName': stateRegex }] }).sort({ asOfDate: -1 }).lean().catch(() => null),
      School.find({ $or: [{ 'geo.districtName': cityRegex }, { 'geo.stateName': cityRegex }, { 'geo.stateName': stateRegex }] }).limit(5).lean().catch(() => []),
      Budget.findOne({ $or: [{ 'geo.stateName': cityRegex }, { 'geo.districtName': cityRegex }, { 'geo.stateName': stateRegex }] }).lean().catch(() => null),
      CropPrice.find({ $or: [{ 'geo.districtName': cityRegex }, { 'geo.stateName': cityRegex }, { 'geo.stateName': stateRegex }] }).limit(5).lean().catch(() => []),
      InfraNews.find({ $or: [{ location: cityRegex }, { title: cityRegex }, { location: stateRegex }] }).limit(5).lean().catch(() => []),
    ]);

    const result = { weather, schemes, jjm, pmay, schools, budget, cropPrices, infraNews, city, area };

    const dataCount = [weather, jjm, pmay, budget].filter(Boolean).length
      + schemes.length + schools.length + cropPrices.length + infraNews.length;

    emit('data_ready', {
      stage: 'gov',
      count: dataCount,
      message: `Government data loaded: ${dataCount} data points from official sources`,
    });

    logger.info(`[GovAdapter] ✅ Loaded gov data for ${city} — ${dataCount} data points`);
    return result;

  } catch (err) {
    logger.error(`[GovAdapter] ❌ Failed: ${err.message}`);
    emit('stage_update', { stage: 'gov', status: 'error', message: `Government DB unavailable: ${err.message}` });
    return null;
  }
}

module.exports = { runGovDataQuery };
