export interface StateLgd {
  code: string;
  abbr: string;
}

export const STATE_LGD: Record<string, StateLgd> = {
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

export function resolveState(rawName = ''): StateLgd | null {
  const key = rawName.trim().toLowerCase();
  return STATE_LGD[key] || null;
}

export interface GeoTag {
  stateName: string | null;
  stateLgdCode: string | null;
  stateAbbr: string | null;
  districtName: string | null;
  location?: { type: string; coordinates: number[] };
}

export function buildGeoTag(stateName: string, districtName: string | null = null, coordinates: number[] | null = null): GeoTag {
  const state = resolveState(stateName);
  const tag: GeoTag = {
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
