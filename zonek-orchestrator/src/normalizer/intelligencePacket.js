'use strict';
/**
 * INTELLIGENCE PACKET BUILDER
 * Merges all 4 stage results into a single normalized JSON object.
 * Every data point is tagged with its source, timestamp, and confidence.
 * This packet is the ONLY thing the AI report generator ever sees.
 */

function buildIntelligencePacket(input, data) {
  const { businessType, location, budget, spaceReq, businessFormat } = input;
  const { browser, rentals, gov, competitors } = data;

  const packet = {
    query: {
      businessType,
      location,
      budget_inr:     budget   || null,
      space_req_sqft: spaceReq || null,
      businessFormat: businessFormat || 'Brick & Mortar',
      generatedAt:    new Date().toISOString(),
    },

    // ── Web Intelligence ──────────────────────────────────────────────────
    web_intelligence: buildWebIntel(browser),

    // ── Rental Market ─────────────────────────────────────────────────────
    rentals: buildRentalPacket(rentals, budget),

    // ── Competitors ───────────────────────────────────────────────────────
    competitors: buildCompetitorPacket(competitors, location),

    // ── Government Data ───────────────────────────────────────────────────
    gov_data: buildGovPacket(gov, businessType),
  };

  return packet;
}

// ── Builder Functions ──────────────────────────────────────────────────────────

function buildWebIntel(browser) {
  if (!browser) return { status: 'unavailable', confidence: 'UNAVAILABLE', groups: {} };

  return {
    status:     'ok',
    confidence: browser.overall_confidence || 'MEDIUM',
    sources_checked: browser.sources_checked || 0,
    sources_used:    browser.sources_used    || 0,
    groups: browser.groups || {},
  };
}

function buildRentalPacket(rentals, budget) {
  if (!rentals || !rentals.all_listings?.length) {
    return { status: 'unavailable', confidence: 'UNAVAILABLE', total: 0, listings: [] };
  }

  const listings = rentals.all_listings.filter(l => 
    l.rent_per_month && 
    l.rent_per_month > 500 && 
    l.rent_per_month < 10000000 // Ignore insane outliers > 1Cr
  );
  const rents    = listings.map(l => l.rent_per_month).filter(Boolean).sort((a, b) => a - b);

  const avg = rents.length ? Math.round(rents.reduce((s, r) => s + r, 0) / rents.length) : null;
  const min = rents[0]   || null;
  const max = rents[rents.length - 1] || null;

  // Outlier removal: discard rents > 2 std-devs from mean
  let filteredRents = rents;
  if (avg && rents.length > 3) {
    const variance = rents.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / rents.length;
    const std = Math.sqrt(variance);
    filteredRents = rents.filter(r => Math.abs(r - avg) <= 2 * std);
  }
  const cleanAvg = filteredRents.length
    ? Math.round(filteredRents.reduce((s, r) => s + r, 0) / filteredRents.length) : null;

  // Budget fit analysis
  let budgetAnalysis = null;
  if (budget && cleanAvg) {
    const annualRent   = cleanAvg * 12;
    const budgetPct    = Math.round((annualRent / budget) * 100);
    budgetAnalysis = { annual_rent_inr: annualRent, budget_consumed_pct: budgetPct };
  }

  // Confidence based on listing count
  const confidence = listings.length >= 5 ? 'HIGH_CONFIDENCE'
                   : listings.length >= 3 ? 'MEDIUM_CONFIDENCE'
                   : 'LOW_CONFIDENCE';

  return {
    status:          'ok',
    confidence,
    total:           listings.length,
    avg_rent_inr:    cleanAvg,
    min_rent_inr:    min,
    max_rent_inr:    max,
    budget_analysis: budgetAnalysis,
    platforms:       rentals.platforms || {},
    listings:        listings.slice(0, 20).map(l => ({
      title:            l.title       || '',
      rent_per_month:   l.rent_per_month,
      sqft:             l.area_sqft   || l.sqft || null,
      listing_url:      l.listing_url || null,
      source:           l.source_platform || 'unknown',
      location_verified:l.location_verified || false,
      scraped_at:       l.scraped_at  || new Date().toISOString(),
    })),
  };
}

function buildCompetitorPacket(competitors, location) {
  if (!competitors) return { status: 'unavailable', confidence: 'UNAVAILABLE', count: 0, competitors: [] };

  const count = competitors.count || 0;
  const saturation = count >= 10 ? 'HIGH' : count >= 5 ? 'MEDIUM' : count >= 1 ? 'LOW' : 'NONE';

  return {
    status:       count > 0 ? 'ok' : 'partial',
    confidence:   count > 0 ? 'HIGH_CONFIDENCE' : 'LOW_CONFIDENCE',
    count,
    saturation,
    source:       competitors.source || 'justdial',
    source_url:   competitors.url    || null,
    scraped_at:   competitors.scraped_at || new Date().toISOString(),
    note:         competitors.note   || null,
    competitors:  (competitors.competitors || []).slice(0, 15).map(c => ({
      name:       c.name    || 'Unknown',
      rating:     c.rating  || null,
      reviews:    c.reviews || 0,
      address:    c.address || location,
      url:        c.url     || null,
      source:     'justdial',
    })),
  };
}

function buildGovPacket(gov, businessType) {
  if (!gov) return { status: 'unavailable' };

  const { weather, schemes, jjm, pmay, schools, budget, cropPrices, infraNews, city } = gov;

  // Filter schemes relevant to business type
  const btLower = businessType.toLowerCase();
  const relevantSchemes = (schemes || []).filter(s => {
    const text = `${s.schemeName || ''} ${s.category || ''} ${s.tags || ''}`.toLowerCase();
    return text.includes(btLower) || text.includes('msme') || text.includes('startup') ||
           text.includes('food') || text.includes('entrepreneur');
  }).slice(0, 5);

  return {
    status: 'ok',
    weather: weather ? {
      rainfall_mm:      weather.rainfallMm    || weather.precipitation || null,
      temperature_c:    weather.temperatureC  || null,
      season:           weather.season        || null,
      source:           'Open-Meteo',
      scraped_at:       weather.fetchedAt     || null,
    } : { status: 'unavailable' },
 
    jjm: jjm ? {
      water_coverage_pct: jjm.coveragePct || jjm.coveragePercent || null,
      district:           jjm.geo?.districtName || jjm.district || city,
      source:             'jaljeevanmission.gov.in',
    } : { status: 'unavailable' },
 
    pmay: pmay ? {
      sanctioned:   pmay.housesSanctioned || pmay.sanctioned || null,
      district:     pmay.geo?.districtName || pmay.district || city,
      source:       'pmayg.nic.in',
    } : { status: 'unavailable' },

    schools: schools?.length ? {
      count:    schools.length,
      district: city,
      source:   'UDISE+',
    } : { status: 'unavailable' },

    budget: budget ? {
      state:                   budget.state || null,
      district_allocation:     budget.districtAllocation || budget.allocation || null,
      allocation_crore:        budget.allocationCrore   || null,
      infrastructure_focus:    budget.focus             || null,
      source:                  'State Finance Department',
      year:                    budget.year              || '2025-26',
    } : { status: 'unavailable' },

    crop_prices: cropPrices?.length ? {
      top_crops: cropPrices.slice(0, 3).map(c => ({
        commodity:    c.commodity || c.crop,
        price_per_qt: c.modalPrice || c.price,
        market:       c.market || city,
      })),
      source: 'Agmarknet / data.gov.in',
    } : { status: 'unavailable' },

    infrastructure_news: infraNews?.length ? {
      recent: infraNews.slice(0, 3).map(n => ({ title: n.title, date: n.pubDate || n.date })),
      source: 'RSS / State Govt',
    } : { status: 'unavailable' },

    schemes: {
      relevant_count: relevantSchemes.length,
      schemes:        relevantSchemes.map(s => ({
        name:        s.schemeName || s.name,
        benefit:     s.benefit   || s.description,
        eligibility: s.eligibility,
        source:      'myscheme.gov.in',
      })),
    },
  };
}

module.exports = { buildIntelligencePacket };
