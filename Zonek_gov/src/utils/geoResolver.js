'use strict';
const { supabase } = require('../config/db');
const { resolveState, STATE_LGD } = require('./lgdMapper');
const { DISTRICT_SEED } = require('./districtSeed');
const logger = require('./logger');

const stateCache = new Map();
const districtCache = new Map();

let geoSeeded = false;
async function ensureGeoSeeded() {
  if (geoSeeded) return;
  geoSeeded = true;
  logger.info('[GeoResolver] Seeding all states and districts from static lists...');
  // Seed states
  for (const [stateName, info] of Object.entries(STATE_LGD)) {
    try {
      await ensureState(stateName);
    } catch (e) {
      logger.warn(`[GeoResolver] Failed to ensure state ${stateName}: ${e.message}`);
    }
  }
  // Seed districts from DISTRICT_SEED
  for (const {state, district} of DISTRICT_SEED) {
    try {
      const stateData = await ensureState(state);
      await ensureDistrict(stateData.id, district);
    } catch (e) {
      logger.warn(`[GeoResolver] Failed to ensure district ${district}, ${state}: ${e.message}`);
    }
  }
  logger.info('[GeoResolver] Seeding complete.');
}

/**
 * Ensure a state record exists and return its data (id, lgd_code, abbr).
 * If the record exists but lgd_code or abbr is missing/outdated, update it.
 * @param {string} stateName - State name (e.g., 'Karnataka')
 * @returns {Promise<Object>} { id, lgd_code, abbr }
 */
async function ensureState(stateName) {
  if (!stateName || typeof stateName !== 'string') {
    throw new Error('Invalid stateName');
  }
  const key = stateName.trim();
  const cacheKey = key.toLowerCase();

  // Check cache
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey);
  }

  // Try to fetch existing record
  let { data, error } = await supabase
    .from('gov_states')
    .select('id, lgd_code, abbr')
    .eq('name', key)
    .maybeSingle();

  if (error) {
    logger.error(`[GeoResolver] Failed to fetch state ${key}: ${error.message}`);
    throw error;
  }

  if (data) {
    // Check if we need to update lgd_code and abbr from our mapper
    const lgdInfo = resolveState(key);
    const needsUpdate =
      !data.lgd_code ||
      !data.abbr ||
      data.lgd_code !== lgdInfo.code ||
      data.abbr !== lgdInfo.abbr;

    if (needsUpdate) {
      const { data: updatedData, error: updateError } = await supabase
        .from('gov_states')
        .update({ lgd_code: lgdInfo.code, abbr: lgdInfo.abbr })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        logger.error(`[GeoResolver] Failed to update state ${key}: ${updateError.message}`);
        throw updateError;
      }
      data = updatedData;
      logger.info(`[GeoResolver] Updated LGD info for state ${key}`);
    }

    stateCache.set(cacheKey, data);
    return data;
  }

  // State not found, insert with LGD info from mapper
  const lgdInfo = resolveState(key);
  if (!lgdInfo) {
    throw new Error(`LGD info not found for state: ${key}`);
  }

  const { data: insertedData, error: insertError } = await supabase
    .from('gov_states')
    .insert({ name: key, lgd_code: lgdInfo.code, abbr: lgdInfo.abbr })
    .select()
    .single();

  if (insertError) {
    logger.error(`[GeoResolver] Failed to insert state ${key}: ${insertError.message}`);
    throw insertError;
  }

  stateCache.set(cacheKey, insertedData);
  logger.info(`[GeoResolver] Inserted new state ${key}`);
  return insertedData;
}

/**
 * Ensure a district record exists for the given state and return its id.
 * @param {string|number} stateId - State UUID or ID
 * @param {string} districtName - District name (e.g., 'Bangalore Urban')
 * @returns {Promise<Object>} { id }
 */
async function ensureDistrict(stateId, districtName) {
  if (!districtName || typeof districtName !== 'string') {
    throw new Error('Invalid districtName');
  }
  const stateIdStr = String(stateId);
  const districtNameTrim = districtName.trim();
  const cacheKey = `${stateIdStr}::${districtNameTrim.toLowerCase()}`;

  // Check cache
  if (districtCache.has(cacheKey)) {
    return districtCache.get(cacheKey);
  }

  // Try to fetch existing record
  let { data, error } = await supabase
    .from('gov_districts')
    .select('id')
    .eq('state_id', stateIdStr)
    .eq('name', districtNameTrim)
    .maybeSingle();

  if (error) {
    logger.error(`[GeoResolver] Failed to fetch district ${districtNameTrim} for state ${stateIdStr}: ${error.message}`);
    throw error;
  }

  if (data) {
    districtCache.set(cacheKey, data);
    return data;
  }

  // District not found, insert
  const { data: insertedData, error: insertError } = await supabase
    .from('gov_districts')
    .insert({ state_id: stateIdStr, name: districtNameTrim })
    .select()
    .single();

  if (insertError) {
    logger.error(`[GeoResolver] Failed to insert district ${districtNameTrim} for state ${stateIdStr}: ${insertError.message}`);
    throw insertError;
  }

  districtCache.set(cacheKey, insertedData);
  logger.info(`[GeoResolver] Inserted new district ${districtNameTrim} for state ${stateIdStr}`);
  return insertedData;
}

/**
 * Resolve state and district IDs from names.
 * @param {string} stateName - State name
 * @param {string} [districtName] - Optional district name
 * @returns {Promise<{stateId: string, districtId: string|null}>}
 */
async function resolveGeoIds(stateName, districtName = null) {
  // Ensure geo seed (states and districts) is populated before resolving
  await ensureGeoSeeded();
  try {
    const stateData = await ensureState(stateName);
    let districtId = null;
    if (districtName) {
      const districtData = await ensureDistrict(stateData.id, districtName);
      districtId = districtData.id;
    }
    return { stateId: stateData.id, districtId };
  } catch (err) {
    logger.error(`[GeoResolver] Failed to resolve geo IDs for ${stateName}, ${districtName}: ${err.message}`);
    throw err;
  }
}

module.exports = {
  resolveGeoIds,
  ensureState,
  ensureDistrict,
  // For testing/debugging
  _caches: { state: stateCache, district: districtCache },
};