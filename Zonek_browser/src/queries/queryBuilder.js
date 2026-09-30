'use strict';
/**
 * QUERY BUILDER
 * Generates 6 targeted search query groups for any business + location.
 * All templates are India-specific and entrepreneurship-focused.
 */

const BUSINESS_CATEGORY_MAP = {
  'cafe': 'food & beverage',
  'restaurant': 'food & beverage',
  'cloud kitchen': 'food & beverage',
  'grocery': 'retail',
  'pharmacy': 'healthcare retail',
  'gym': 'fitness',
  'salon': 'personal care',
  'tuition': 'education',
  'coaching': 'education',
  'it services': 'technology services',
  'consultancy': 'professional services',
  'clothing': 'retail fashion',
  'bakery': 'food & beverage',
  'hotel': 'hospitality',
};

function getCategoryLabel(businessType) {
  const lower = businessType.toLowerCase();
  for (const [key, cat] of Object.entries(BUSINESS_CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return 'small business';
}

/**
 * Build all 6 query groups for a business type + location.
 * Returns: { groupId: [query1, query2, query3], ... }
 */
function buildQueryGroups(businessType, location, state = '') {
  const bt = businessType.trim();
  const loc = location.trim();
  const city = loc.split(',').pop().trim(); // "RS Puram, Coimbatore" → "Coimbatore"
  const category = getCategoryLabel(bt);

  return {
    market_trends: {
      label: 'Market Trend Intelligence',
      queries: [
        `${bt} market growth India 2025 statistics`,
        `${bt} industry revenue India 2025 2026`,
        `${bt} demand trends ${state || city} 2025`,
      ],
    },

    local_competitors: {
      label: 'Local Competitor Intelligence',
      queries: [
        `best ${bt} in ${loc} review`,
        `top rated ${bt} ${city} list`,
        `${bt} near ${loc} Justdial Zomato`,
      ],
    },

    setup_costs: {
      label: 'Cost & Investment Intelligence',
      queries: [
        `${bt} setup cost India 2025 investment required`,
        `cost to open ${bt} India small business`,
        `${bt} monthly expenses profit margin India 2025`,
      ],
    },

    local_economy: {
      label: 'Local Economic Signal',
      queries: [
        `${city} business growth investment opportunities 2025`,
        `${city} new infrastructure development projects 2025`,
        `${city} commercial market real estate 2025`,
      ],
    },

    regulatory: {
      label: 'Regulatory & Licensing',
      queries: [
        `${bt} license registration requirements ${state || 'India'} 2025`,
        `FSSAI MSME GST ${category} business India registration`,
        `${bt} permits compliance rules India entrepreneur`,
      ],
    },

    schemes: {
      label: 'Government Scheme Matching',
      queries: [
        `government scheme ${bt} ${state || 'India'} 2025 subsidy`,
        `MSME loan ${category} India 2025 free`,
        `startup scheme ${category} India eligibility apply`,
      ],
    },
  };
}

module.exports = { buildQueryGroups, getCategoryLabel };
