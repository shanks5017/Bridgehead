'use strict';

/**
 * LGD (Local Government Directory) state codes — used by all GOI systems.
 * These are the official numeric codes — critical for cross-module JOIN queries.
 */
const STATE_LGD = {
  'andhra pradesh': { code: '28', abbr: 'AP' },
  'arunachal pradesh': { code: '12', abbr: 'AR' },
  'assam': { code: '18', abbr: 'AS' },
  'bihar': { code: '10', abbr: 'BR' },
  'chhattisgarh': { code: '22', abbr: 'CG' },
  'goa': { code: '30', abbr: 'GA' },
  'gujarat': { code: '24', abbr: 'GJ' },
  'haryana': { code: '06', abbr: 'HR' },
  'himachal pradesh': { code: '02', abbr: 'HP' },
  'jharkhand': { code: '20', abbr: 'JH' },
  'karnataka': { code: '29', abbr: 'KA' },
  'kerala': { code: '32', abbr: 'KL' },
  'madhya pradesh': { code: '23', abbr: 'MP' },
  'maharashtra': { code: '27', abbr: 'MH' },
  'manipur': { code: '14', abbr: 'MN' },
  'meghalaya': { code: '17', abbr: 'ML' },
  'mizoram': { code: '15', abbr: 'MZ' },
  'nagaland': { code: '13', abbr: 'NL' },
  'odisha': { code: '21', abbr: 'OD' },
  'punjab': { code: '03', abbr: 'PB' },
  'rajasthan': { code: '08', abbr: 'RJ' },
  'sikkim': { code: '11', abbr: 'SK' },
  'tamil nadu': { code: '33', abbr: 'TN' },
  'telangana': { code: '36', abbr: 'TS' },
  'tripura': { code: '16', abbr: 'TR' },
  'uttar pradesh': { code: '09', abbr: 'UP' },
  'uttarakhand': { code: '05', abbr: 'UK' },
  'west bengal': { code: '19', abbr: 'WB' },
  'delhi': { code: '07', abbr: 'DL' },
  'jammu and kashmir': { code: '01', abbr: 'JK' },
  'ladakh': { code: '38', abbr: 'LA' },
};

/**
 * Normalize and resolve state name to LGD metadata.
 * Returns { lgdCode, abbreviation } or null if not found.
 */
function resolveState(rawName = '') {
  const key = rawName.trim().toLowerCase();
  return STATE_LGD[key] || null;
}

/**
 * Build a standardized geo-tag object to embed in every MongoDB document.
 * @param {string} stateName
 * @param {string} [districtName]
 * @param {number[]} [coordinates] - [lng, lat]
 */
function buildGeoTag(stateName, districtName = null, coordinates = null) {
  const state = resolveState(stateName);
  const tag = {
    stateName: stateName ? stateName.trim() : null,
    stateLgdCode: state?.code || null,
    stateAbbr: state?.abbr || null,
    districtName: districtName ? districtName.trim() : null,
  };
  if (coordinates && coordinates.length === 2) {
    tag.location = { type: 'Point', coordinates };
  }
  return tag;
}

module.exports = { resolveState, buildGeoTag, STATE_LGD };
