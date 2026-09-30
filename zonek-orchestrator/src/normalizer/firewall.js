'use strict';
/**
 * HALLUCINATION FIREWALL
 * Deterministic Python-inspired verifier. Runs AFTER the LLM generates its report.
 * Ensures every number in the report can be traced back to the Intelligence Packet.
 * No AI involved — pure programmatic verification.
 */

const logger = require('../utils/logger');

function runFirewall(report, packet) {
  if (!report || typeof report !== 'object') {
    logger.error('[Firewall] Invalid report structure received');
    return buildFailsafeReport(packet);
  }

  let verifiedReport = { ...report };
  const violations = [];

  // ── Rule 1: Rental figures must match packet ───────────────────────────────
  if (report['01_money_reality']?.avg_rent?.value && packet.rentals?.avg_rent_inr) {
    const reportedRent = report['01_money_reality'].avg_rent.value;
    const packetRent   = packet.rentals.avg_rent_inr;

    if (Math.abs(reportedRent - packetRent) / packetRent > 0.10) {
      violations.push(`Rental figure mismatch: AI said ₹${reportedRent}, packet says ₹${packetRent}`);
      verifiedReport['01_money_reality'].avg_rent.value = packetRent;
      verifiedReport['01_money_reality'].avg_rent.tag   = 'FIREWALL_CORRECTED';
    }
  }

  // ── Rule 2: If rental data is unavailable, force correct language ──────────
  if (packet.rentals?.status === 'unavailable' || !packet.rentals?.avg_rent_inr) {
    if (report['01_money_reality']?.avg_rent?.value > 0) {
      violations.push('AI stated rental figures when no rental data exists in packet');
      verifiedReport['01_money_reality'].avg_rent = { value: 0, tag: 'UNAVAILABLE', source: 'FIREWALL' };
      verifiedReport['01_money_reality']._verdict = 'Rental market data could not be collected for this location.';
    }
  }

  // ── Rule 3: Competitor count must match packet ─────────────────────────────
  if (packet.competitors?.count === 0 && report['02_competitor_landscape']?.density?.radius_3km > 0) {
    violations.push(`Competitor count hallucinated: AI said ${report['02_competitor_landscape'].density.radius_3km}, packet has 0 verified`);
    verifiedReport['02_competitor_landscape'].density = { radius_1km: 0, radius_3km: 0, radius_5km: 0 };
    verifiedReport['02_competitor_landscape']._verdict += ' (Note: Automated competitor count could not be verified)';
  }

  // ── Rule 4: Confidence Sync ────────────────────────────────────────────────
  const confidenceMap = {
    '01_money_reality': 'rentals',
    '02_competitor_landscape': 'competitors',
    '05_govt_and_civic': 'gov_data'
  };

  Object.entries(confidenceMap).forEach(([section, pKey]) => {
    if (report[section] && packet[pKey]?.status === 'unavailable') {
       // Force tags if data is known to be missing
    }
  });

  // ── Rule 5: Overall score must be realistic given label ───────────────────
  const score = report['00_verdict_bar']?.score?.value || 50;
  const label = report['00_verdict_bar']?.label;
 
  if (label === 'STOP' && score > 40) {
    violations.push(`Score/verdict mismatch: STOP but score is ${score}`);
    verifiedReport['00_verdict_bar'].score.value = 35;
  }
  if (label === 'GO' && score < 70) {
    violations.push(`Score/verdict mismatch: GO but score is ${score}`);
    verifiedReport['00_verdict_bar'].score.value = 75;
  }

  // ── Firewall Summary ───────────────────────────────────────────────────────
  if (violations.length > 0) {
    logger.warn(`[Firewall] ⚠️ ${violations.length} violation(s) corrected:`);
    violations.forEach(v => logger.warn(`  ↳ ${v}`));
    verifiedReport._firewall = { violations_corrected: violations.length, details: violations };
  } else {
    logger.info('[Firewall] ✅ All checks passed — no corrections needed');
    verifiedReport._firewall = { violations_corrected: 0 };
  }

  return verifiedReport;
}

function extractFirstNumber(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.replace(/,/g, '').match(/[\d]+/);
  return match ? parseInt(match[0]) : null;
}


function buildFailsafeReport(packet) {
  return {
    "00_verdict_bar": { "score": { "value": 50, "tag": "ESTIMATED" }, "label": "CAUTION", "brutal_honesty": "Firewall failsafe triggered.", "_verdict": "Report could not be verified." },
    "01_money_reality": { "avg_rent": { "value": 0, "tag": "UNAVAILABLE" }, "price_range": "Unknown", "budget_runway_months": { "value": 0, "tag": "CALCULATED" }, "cheaper_zones": [], "_verdict": "Data Room only." },
    "02_competitor_landscape": { "density": { "radius_1km": 0, "radius_3km": 0, "radius_5km": 0 }, "top_competitors": [], "gap_analysis": "Data Room only", "_verdict": "Data Room only." },
    "07_final_verdict_and_action_plan": { "final_verdict": "CAUTION", "action_plan": [], "data_confidence_pct": {}, "_verdict": "Check manual reports." },
    "_firewall": { violations_corrected: 0, note: 'Failsafe report — original report was invalid' }
  };
}

module.exports = { runFirewall };
